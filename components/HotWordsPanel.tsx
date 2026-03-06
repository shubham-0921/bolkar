"use client";

import { useState } from "react";
import type { HotWord } from "@/core/types";

interface Props {
  hotWords: HotWord[];
  onAdd: (trigger: string, replacement: string) => string | null;
  onRemove: (trigger: string) => void;
}

export default function HotWordsPanel({ hotWords, onAdd, onRemove }: Props) {
  const [trigger, setTrigger] = useState("");
  const [replacement, setReplacement] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [editingTrigger, setEditingTrigger] = useState<string | null>(null);

  const handleAdd = () => {
    if (!trigger.trim()) { setFormError("Trigger required"); return; }
    if (!replacement.trim()) { setFormError("Replacement required"); return; }
    const err = onAdd(trigger, replacement);
    if (err) { setFormError(err); return; }
    setTrigger("");
    setReplacement("");
    setFormError(null);
  };

  return (
    <div className="space-y-4">
      {/* Existing hot words */}
      {hotWords.length > 0 && (
        <div className="space-y-2">
          {hotWords.map((hw) => (
            <div
              key={hw.trigger}
              className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold font-mono"
                    style={{ backgroundColor: "rgba(37,99,235,0.15)", color: "#93c5fd", border: "1px solid rgba(37,99,235,0.3)" }}
                  >
                    {hw.trigger}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  {editingTrigger === hw.trigger ? (
                    <input
                      autoFocus
                      defaultValue={hw.replacement}
                      onBlur={(e) => {
                        onAdd(hw.trigger, e.target.value);
                        setEditingTrigger(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") setEditingTrigger(null);
                      }}
                      className="flex-1 rounded-lg px-2 py-0.5 text-xs text-white outline-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)" }}
                    />
                  ) : (
                    <button
                      className="text-xs text-zinc-300 text-left flex-1 truncate hover:text-white transition-colors"
                      onClick={() => setEditingTrigger(hw.trigger)}
                      title="Click to edit"
                    >
                      {hw.replacement}
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => onRemove(hw.trigger)}
                className="shrink-0 rounded-lg p-1 text-zinc-600 hover:text-red-400 transition-colors"
                title="Remove"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#71717a" }}>
          Add hot word
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              value={trigger}
              onChange={(e) => { setTrigger(e.target.value); setFormError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder='Trigger — e.g. "my email"'
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
              style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
          <svg className="mt-2.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <div className="flex-1">
            <input
              value={replacement}
              onChange={(e) => { setReplacement(e.target.value); setFormError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder='Replacement — e.g. "me@example.com"'
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
              style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
        </div>
        {formError && <p className="text-xs text-red-400">{formError}</p>}
        <button
          onClick={handleAdd}
          className="w-full rounded-lg py-2 text-sm font-semibold transition-all active:scale-95"
          style={{ backgroundColor: "rgba(37,99,235,0.2)", color: "#93c5fd", border: "1px solid rgba(37,99,235,0.3)" }}
        >
          + Add
        </button>
      </div>

      {hotWords.length === 0 && (
        <p className="text-xs text-center" style={{ color: "#52525b" }}>
          No hot words yet. Add a trigger phrase and what it should expand to.
        </p>
      )}
    </div>
  );
}
