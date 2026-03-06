import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import { colors, radius } from '../theme';
import { startFloating, stopFloating, isFloatingRunning } from '../modules/FloatingBubble';
import { useHistory, timeAgo } from '../hooks/useHistory';
import { loadHistory } from '../hooks/useHistory';
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

export default function HomeScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draftUrl, setDraftUrl] = useState(DEFAULT_BACKEND_URL);
  const { items: history, addItem, clearHistory } = useHistory([]);

  // Load settings and history from storage on mount
  useEffect(() => {
    (async () => {
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
      const hist = await loadHistory();
      if (hist.length > 0) {
        hist.forEach((item) => addItem(item.transcript, item.mode, item.processingMs));
      }
      if (Platform.OS === 'android') {
        const running = await isFloatingRunning().catch(() => false);
        setIsRunning(running);
      }
    })();
  }, []);

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
      });
      setIsRunning(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to start floating bubble';
      Alert.alert('Error', msg);
    }
  };

  const requestOverlayPermission = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  };

  const cfg = settings.mode === 'translate'
    ? { primary: colors.translatePrimary, accent: colors.translateAccent }
    : { primary: colors.transcribePrimary, accent: colors.transcribeAccent };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          bol<Text style={[styles.logoAccent, { color: cfg.accent }]}>kar</Text>
        </Text>
        <TouchableOpacity onPress={() => setShowSettings(!showSettings)} style={styles.settingsBtn}>
          <Text style={styles.settingsBtnText}>⚙ Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Settings panel */}
      {showSettings && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Settings</Text>

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
          <Text style={styles.hint}>
            Audio is sent to your server — your API key stays server-side.
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: cfg.primary }]}
            onPress={handleSaveSettings}
          >
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mode toggle */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mode</Text>
        <View style={styles.modeRow}>
          {(['translate', 'transcribe'] as TranscriptionMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.modePill,
                settings.mode === m && { backgroundColor: cfg.primary },
              ]}
              onPress={() => saveSettings({ ...settings, mode: m })}
            >
              <Text style={[
                styles.modePillText,
                settings.mode === m && { color: '#fff' },
              ]}>
                {m === 'translate' ? '→ English' : 'As Spoken'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.modeDesc}>
          {settings.mode === 'translate'
            ? 'Speak any Indian language → clean English'
            : 'Speak any language → text in same language'}
        </Text>
      </View>

      {/* Floating bubble control */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Floating Mic</Text>
        <Text style={styles.hint}>
          A mic button floats over all your other apps.{'\n'}
          Tap it to record → result is auto-copied to clipboard.
        </Text>

        {Platform.OS === 'android' ? (
          <>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: isRunning ? colors.recordingRed : cfg.primary },
              ]}
              onPress={handleToggleFloating}
            >
              <Text style={styles.buttonText}>
                {isRunning ? 'Dismiss Floating Mic' : 'Launch Floating Mic'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={requestOverlayPermission}>
              <Text style={styles.linkText}>Grant "Display over other apps" permission →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.hint}>Floating bubble is Android-only.</Text>
        )}
      </View>

      {/* History */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>History</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <Text style={styles.hint}>No transcriptions yet. Use the floating mic to get started.</Text>
        ) : (
          history.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyItem}
              onPress={() => Clipboard.setStringAsync(item.transcript)}
            >
              <View style={styles.rowBetween}>
                <Text style={[
                  styles.historyBadge,
                  { color: item.mode === 'translate' ? colors.translateAccent : colors.transcribeAccent },
                ]}>
                  {item.mode === 'translate' ? '→ English' : 'As Spoken'}
                </Text>
                <Text style={styles.textMuted}>{timeAgo(item.timestamp)}</Text>
              </View>
              <Text style={styles.historyText} numberOfLines={3}>{item.transcript}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  logo: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  logoAccent: { color: colors.translateAccent },
  settingsBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsBtnText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 4,
  },
  hint: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginTop: 4, marginBottom: 12 },
  button: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
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
  modeDesc: { fontSize: 12, color: colors.textMuted },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  clearText: { fontSize: 12, color: colors.recordingRed },
  historyItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  historyBadge: { fontSize: 12, fontWeight: '700' },
  historyText: { color: colors.textPrimary, fontSize: 14, lineHeight: 20, marginTop: 4 },
  textMuted: { color: colors.textMuted, fontSize: 11 },
});
