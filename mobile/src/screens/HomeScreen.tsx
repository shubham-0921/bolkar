import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Audio } from 'expo-av';
import { colors, radius } from '../theme';
import { startFloating, stopFloating, isFloatingRunning } from '../modules/FloatingBubble';
import { timeAgo } from '../hooks/useHistory';
import { getDeviceId } from '../utils/deviceId';
import type { TranscriptionMode } from '@/core/types';

const SETTINGS_KEY = 'bolkar-settings';
const DEFAULT_BACKEND_URL = 'http://192.168.0.106:3000';

interface Settings {
  mode: TranscriptionMode;
  backendUrl: string;
}

const DEFAULT_SETTINGS: Settings = {
  mode: 'translate',
  backendUrl: DEFAULT_BACKEND_URL,
};

interface HistoryItem {
  id: string;
  transcript: string;
  mode: 'transcribe' | 'translate';
  processingMs: number | null;
  createdAt: string;
}

interface HotWord {
  id: string;
  trigger: string;
  replacement: string;
}

export default function HomeScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'hotwords'>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [draftUrl, setDraftUrl] = useState(DEFAULT_BACKEND_URL);

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Hot words
  const [hotWords, setHotWords] = useState<HotWord[]>([]);
  const [hwLoading, setHwLoading] = useState(false);
  const [draftTrigger, setDraftTrigger] = useState('');
  const [draftReplacement, setDraftReplacement] = useState('');

  const deviceIdRef = useRef<string>('');

  useEffect(() => {
    (async () => {
      const id = await getDeviceId();
      deviceIdRef.current = id;

      const raw = await AsyncStorage.getItem(SETTINGS_KEY).catch(() => null);
      if (raw) {
        const saved = JSON.parse(raw);
        const merged: Settings = {
          mode: saved.mode ?? DEFAULT_SETTINGS.mode,
          backendUrl: saved.backendUrl || DEFAULT_BACKEND_URL,
        };
        setSettings(merged);
        setDraftUrl(merged.backendUrl);
      }

      if (Platform.OS === 'android') {
        const running = await isFloatingRunning().catch(() => false);
        setIsRunning(running);
      }
    })();
  }, []);

  // Fetch when tab changes
  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
    if (activeTab === 'hotwords') fetchHotWords();
  }, [activeTab]);

  const apiHeaders = useCallback(() => ({
    'x-device-id': deviceIdRef.current,
  }), []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${settings.backendUrl}/api/history`, { headers: apiHeaders() });
      if (res.ok) setHistory(await res.json());
    } catch { /* network error, silent */ }
    finally { setHistoryLoading(false); }
  }, [settings.backendUrl, apiHeaders]);

  const clearHistory = useCallback(async () => {
    try {
      await fetch(`${settings.backendUrl}/api/history`, { method: 'DELETE', headers: apiHeaders() });
      setHistory([]);
    } catch { /* silent */ }
  }, [settings.backendUrl, apiHeaders]);

  const fetchHotWords = useCallback(async () => {
    setHwLoading(true);
    try {
      const res = await fetch(`${settings.backendUrl}/api/hot-words`, { headers: apiHeaders() });
      if (res.ok) setHotWords(await res.json());
    } catch { /* silent */ }
    finally { setHwLoading(false); }
  }, [settings.backendUrl, apiHeaders]);

  const addHotWord = useCallback(async () => {
    if (!draftTrigger.trim() || !draftReplacement.trim()) return;
    try {
      const res = await fetch(`${settings.backendUrl}/api/hot-words`, {
        method: 'POST',
        headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: draftTrigger.trim(), replacement: draftReplacement.trim() }),
      });
      if (res.ok) {
        const item = await res.json();
        setHotWords((prev) => [...prev, item]);
        setDraftTrigger('');
        setDraftReplacement('');
      }
    } catch { /* silent */ }
  }, [settings.backendUrl, apiHeaders, draftTrigger, draftReplacement]);

  const deleteHotWord = useCallback(async (id: string) => {
    try {
      await fetch(`${settings.backendUrl}/api/hot-words?id=${id}`, { method: 'DELETE', headers: apiHeaders() });
      setHotWords((prev) => prev.filter((h) => h.id !== id));
    } catch { /* silent */ }
  }, [settings.backendUrl, apiHeaders]);

  const saveSettings = useCallback(async (updated: Settings) => {
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  }, []);

  const handleSaveSettings = async () => {
    const url = draftUrl.trim() || DEFAULT_BACKEND_URL;
    await saveSettings({ ...settings, backendUrl: url });
    setDraftUrl(url);
    setShowSettings(false);
  };

  const handleToggleFloating = async () => {
    if (isRunning) {
      stopFloating();
      setIsRunning(false);
      return;
    }

    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Microphone permission required', 'Please grant microphone access to use the floating mic.');
      return;
    }

    try {
      startFloating({
        apiKey: '',
        mode: settings.mode,
        backendUrl: settings.backendUrl,
        deviceId: deviceIdRef.current,
      });
      setIsRunning(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to start floating bubble';
      Alert.alert('Error', msg);
    }
  };

  const cfg = settings.mode === 'translate'
    ? { primary: colors.translatePrimary, accent: colors.translateAccent }
    : { primary: colors.transcribePrimary, accent: colors.transcribeAccent };

  return (
    <View style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>
          bol<Text style={[styles.logoAccent, { color: cfg.accent }]}>kar</Text>
        </Text>
        <TouchableOpacity onPress={() => setShowSettings(!showSettings)} style={styles.settingsBtn}>
          <Text style={styles.settingsBtnText}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Settings panel */}
      {showSettings && (
        <View style={styles.settingsPanel}>
          <Text style={styles.label}>Backend URL</Text>
          <TextInput
            style={styles.input}
            value={draftUrl}
            onChangeText={setDraftUrl}
            placeholder={DEFAULT_BACKEND_URL}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />
          <TouchableOpacity style={[styles.btn, { backgroundColor: cfg.primary }]} onPress={handleSaveSettings}>
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>

        {activeTab === 'home' && (
          <>
            {/* Mode toggle */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Mode</Text>
              <View style={styles.modeRow}>
                {(['translate', 'transcribe'] as TranscriptionMode[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modePill, settings.mode === m && { backgroundColor: cfg.primary }]}
                    onPress={() => saveSettings({ ...settings, mode: m })}
                  >
                    <Text style={[styles.modePillText, settings.mode === m && { color: '#fff' }]}>
                      {m === 'translate' ? '→ English' : 'As Spoken'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.hint}>
                {settings.mode === 'translate'
                  ? 'Speak any Indian language → clean English'
                  : 'Speak any language → text in same language'}
              </Text>
            </View>

            {/* Floating mic */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Floating Mic</Text>
              <Text style={styles.hint}>
                A mic button floats over all your other apps.{'\n'}
                Tap it to record → result is auto-copied to clipboard.
              </Text>
              {Platform.OS === 'android' ? (
                <>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: isRunning ? colors.recordingRed : cfg.primary }]}
                    onPress={handleToggleFloating}
                  >
                    <Text style={styles.btnText}>
                      {isRunning ? 'Dismiss Floating Mic' : 'Launch Floating Mic'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openSettings()}>
                    <Text style={styles.linkText}>Grant "Display over other apps" permission →</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.hint}>Floating bubble is Android-only.</Text>
              )}
            </View>
          </>
        )}

        {activeTab === 'history' && (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>History</Text>
              <View style={styles.row}>
                <TouchableOpacity onPress={fetchHistory} style={styles.iconBtn}>
                  <Text style={styles.linkText}>↻ Refresh</Text>
                </TouchableOpacity>
                {history.length > 0 && (
                  <TouchableOpacity onPress={clearHistory} style={styles.iconBtn}>
                    <Text style={styles.clearText}>Clear all</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {historyLoading ? (
              <ActivityIndicator color={cfg.accent} style={{ marginTop: 20 }} />
            ) : history.length === 0 ? (
              <Text style={styles.hint}>No transcriptions yet. Use the floating mic to get started.</Text>
            ) : (
              history.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyItem}
                  onPress={() => Clipboard.setStringAsync(item.transcript)}
                >
                  <View style={styles.rowBetween}>
                    <Text style={[styles.badge, { color: item.mode === 'translate' ? colors.translateAccent : colors.transcribeAccent }]}>
                      {item.mode === 'translate' ? '→ English' : 'As Spoken'}
                    </Text>
                    <Text style={styles.textMuted}>{timeAgo(new Date(item.createdAt).getTime())}</Text>
                  </View>
                  <Text style={styles.historyText} numberOfLines={3}>{item.transcript}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'hotwords' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hot Words</Text>
            <Text style={styles.hint}>
              Automatically replace words in your transcripts.{'\n'}
              E.g. trigger: "Rahul" → replacement: "Rahul Sharma"
            </Text>

            {/* Add new */}
            <View style={styles.hwRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 6, marginBottom: 0 }]}
                value={draftTrigger}
                onChangeText={setDraftTrigger}
                placeholder="Trigger word"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, { flex: 1, marginLeft: 6, marginBottom: 0 }]}
                value={draftReplacement}
                onChangeText={setDraftReplacement}
                placeholder="Replacement"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: cfg.primary, marginTop: 8 }]}
              onPress={addHotWord}
              disabled={!draftTrigger.trim() || !draftReplacement.trim()}
            >
              <Text style={styles.btnText}>Add</Text>
            </TouchableOpacity>

            {/* List */}
            {hwLoading ? (
              <ActivityIndicator color={cfg.accent} style={{ marginTop: 16 }} />
            ) : hotWords.length === 0 ? (
              <Text style={[styles.hint, { marginTop: 16 }]}>No hot words yet.</Text>
            ) : (
              hotWords.map((hw) => (
                <View key={hw.id} style={styles.hwItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hwTrigger}>"{hw.trigger}"</Text>
                    <Text style={styles.hwArrow}>→ {hw.replacement}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteHotWord(hw.id)}>
                    <Text style={styles.clearText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        {([
          { key: 'home', icon: '🎙', label: 'Mic' },
          { key: 'history', icon: '📋', label: 'History' },
          { key: 'hotwords', icon: '⚡', label: 'Hot Words' },
        ] as const).map(({ key, icon, label }) => {
          const active = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tabItem, active && { backgroundColor: cfg.accent + '18', borderTopColor: cfg.accent }]}
              onPress={() => setActiveTab(key)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{icon}</Text>
              <Text style={[styles.tabLabel, active && { color: cfg.accent }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  logoAccent: { color: colors.translateAccent },
  settingsBtn: { padding: 8 },
  settingsBtnText: { fontSize: 18, color: colors.textSecondary },
  settingsPanel: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 16,
  },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 10,
  },
  hint: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginBottom: 10 },
  btn: {
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  linkBtn: { marginTop: 10, alignItems: 'center' },
  linkText: { color: colors.textSecondary, fontSize: 12 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  modePillText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconBtn: { paddingVertical: 2 },
  clearText: { fontSize: 12, color: colors.recordingRed },
  historyItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  badge: { fontSize: 11, fontWeight: '700' },
  historyText: { color: colors.textPrimary, fontSize: 14, lineHeight: 20, marginTop: 4 },
  textMuted: { color: colors.textMuted, fontSize: 11 },
  hwRow: { flexDirection: 'row', marginBottom: 4 },
  hwItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  hwTrigger: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  hwArrow: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 3,
    borderTopColor: 'transparent',
  },
  tabIcon: { fontSize: 22, marginBottom: 4 },
  tabLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.3 },
});
