package com.bolkar.floating

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class BolkarAccessibilityService : AccessibilityService() {

    companion object {
        @Volatile
        var instance: BolkarAccessibilityService? = null
            private set

        fun isEnabled(): Boolean = instance != null
    }

    private var lastFocusedNode: AccessibilityNodeInfo? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        serviceInfo = serviceInfo?.apply {
            eventTypes = AccessibilityEvent.TYPE_VIEW_FOCUSED or
                    AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                    AccessibilityEvent.TYPE_VIEW_CLICKED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            notificationTimeout = 100
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val node = event?.source ?: return
        if (node.isEditable) {
            lastFocusedNode?.recycle()
            lastFocusedNode = AccessibilityNodeInfo.obtain(node)
        }
    }

    override fun onInterrupt() {}

    override fun onDestroy() {
        super.onDestroy()
        lastFocusedNode?.recycle()
        lastFocusedNode = null
        instance = null
    }

    /**
     * Inserts [text] into the currently focused editable field.
     * Tries ACTION_SET_TEXT first (direct insert), falls back to clipboard + paste.
     * Returns true if insertion succeeded.
     */
    fun insertText(text: String): Boolean {
        // Always put text in clipboard first — needed for paste fallbacks
        val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        cm.setPrimaryClip(ClipData.newPlainText("bolkar", text))

        val node = lastFocusedNode?.takeIf { it.isEditable }
            ?: findFocusedEditableNode()

        if (node != null && tryInsertIntoNode(node, text, cm)) return true

        // Clipboard is already set above — for apps with fully custom editors (Notion, etc.)
        // where no accessibility node is reachable, the result card will remain visible
        // so the user can tap into the field and paste manually.
        return false
    }

    private fun tryInsertIntoNode(node: AccessibilityNodeInfo, text: String, cm: ClipboardManager): Boolean {
        // Attempt 1: ACTION_SET_TEXT — sets text directly, works in most apps
        val args = Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
        }
        if (node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) return true

        // Attempt 2: click to focus, then SET_TEXT
        node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        node.performAction(AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS)
        if (node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) return true

        // Attempt 3: node-level paste (clipboard already set)
        if (node.performAction(AccessibilityNodeInfo.ACTION_PASTE)) return true

        // Attempt 4: walk the tree and try every editable node
        val treeNode = findEditableNodeInTree(rootInActiveWindow) ?: return false
        if (treeNode == node) return false
        return tryInsertIntoNode(treeNode, text, cm)
    }

    private fun findFocusedEditableNode(): AccessibilityNodeInfo? {
        val root = rootInActiveWindow ?: return null
        // Try standard input focus first
        root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT)?.takeIf { it.isEditable }?.let { return it }
        // Try accessibility focus
        root.findFocus(AccessibilityNodeInfo.FOCUS_ACCESSIBILITY)?.takeIf { it.isEditable }?.let { return it }
        // Fall back to tree walk — catches Instagram and other apps with custom text fields
        return findEditableNodeInTree(root)
    }

    /** Depth-first search for the first visible, enabled, editable node. */
    private fun findEditableNodeInTree(node: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
        node ?: return null
        if (node.isEditable && node.isVisibleToUser && node.isEnabled) return node
        for (i in 0 until node.childCount) {
            val found = findEditableNodeInTree(node.getChild(i))
            if (found != null) return found
        }
        return null
    }
}
