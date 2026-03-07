import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Audio } from 'expo-av';
import { colors, radius } from '../theme';
import { startFloating, stopFloating, isFloatingRunning } from '../modules/FloatingBubble';
import { timeAgo } from '../hooks/useHistory';
import { getDeviceId } from '../utils/deviceId';
import {
  initAuth,
  googleSignIn,
  authSignOut,
  onAuthChange,
  getAuthState,
  type AuthState,
} from '../lib/authClient';
import type { TranscriptionMode } from '@/core/types';

const BOL_WORDS = [
  { text: 'बोलो', lang: 'Hindi' },
  { text: 'speak', lang: 'English' },
  { text: 'ਬੋਲੋ', lang: 'Punjabi' },
  { text: 'பேசு', lang: 'Tamil' },
  { text: 'বলো', lang: 'Bengali' },
  { text: 'మాట్లాడు', lang: 'Telugu' },
  { text: 'ಮಾತಾಡು', lang: 'Kannada' },
  { text: 'બોલો', lang: 'Gujarati' },
  { text: 'പറയൂ', lang: 'Malayalam' },
  { text: 'बोल', lang: 'Marathi' },
];

const MODE_LABELS = [
  { toEnglish: 'To English',    asSpoken: 'As Spoken'      },
  { toEnglish: 'अंग्रेज़ी में',  asSpoken: 'जैसे बोला'      },
  { toEnglish: 'ஆங்கிலத்தில்',  asSpoken: 'பேசியபடி'       },
  { toEnglish: 'ఆంగ్లంలో',      asSpoken: 'మాట్లాడినట్లు'  },
  { toEnglish: 'ইংরেজিতে',      asSpoken: 'যেভাবে বললাম'   },
  { toEnglish: 'ಆಂಗ್ಲದಲ್ಲಿ',    asSpoken: 'ಮಾತಾಡಿದಂತೆ'    },
  { toEnglish: 'इंग्रजीत',      asSpoken: 'बोललो तसे'      },
];

const USE_CASES = [
  {
    id: 'shop-owner', emoji: '🏪', label: 'Shop Owner', sublabel: 'Hindi → English', language: 'Hindi',
    color: '#d97706', colorText: '#92400e', colorBorder: 'rgba(245,158,11,0.35)',
    before: 'Raju bhai ko bol do 50 kilo atta aur 30 kilo daal kal subah bhejna hai',
    after: 'Please send 50 kg flour and 30 kg lentils by tomorrow morning.',
  },
  {
    id: 'student', emoji: '🎓', label: 'Student', sublabel: 'Tamil → English', language: 'Tamil',
    color: '#059669', colorText: '#064e3b', colorBorder: 'rgba(16,185,129,0.35)',
    before: 'Professor ku mail pathaikanum, project ku one week extension venum',
    after: 'Dear Professor, I would like to request a one-week extension for my project.',
  },
  {
    id: 'sales-rep', emoji: '🤝', label: 'Sales Rep', sublabel: 'Marathi → English', language: 'Marathi',
    color: '#0284c7', colorText: '#0c4a6e', colorBorder: 'rgba(14,165,233,0.35)',
    before: 'Kulkarni sahebanna sangto ki udya bhetayala yenar aahe, proposal tayar aahe',
    after: "Please tell Kulkarni sir that I'll come to meet him tomorrow. The proposal is ready.",
  },
  {
    id: 'doctor', emoji: '🩺', label: 'Doctor', sublabel: 'Telugu → English', language: 'Telugu',
    color: '#e11d48', colorText: '#881337', colorBorder: 'rgba(244,63,94,0.35)',
    before: 'Ee patient ki BP high ga undi, medicine dosage marchandi, two days lo follow up kavali',
    after: 'This patient has high BP. Change the medication dosage and follow up in two days.',
  },
  {
    id: 'developer', emoji: '👨‍💻', label: 'Developer', sublabel: 'Kannada → English', language: 'Kannada',
    color: '#7c3aed', colorText: '#4c1d95', colorBorder: 'rgba(139,92,246,0.35)',
    before: 'Auth module alli bug ide, pull request raise maadi, review aagbekagide',
    after: 'There is a bug in the auth module. Please raise a pull request and get it reviewed.',
  },
  {
    id: 'creator', emoji: '🎬', label: 'Creator', sublabel: 'Bengali → English', language: 'Bengali',
    color: '#ea580c', colorText: '#7c2d12', colorBorder: 'rgba(249,115,22,0.35)',
    before: 'Aaj ke video te bolbo keno chai er dokan coffee shop theke beshi bhalo',
    after: "In today's video, I'll talk about why a tea stall is better than a coffee shop.",
  },
];

const SETTINGS_KEY = 'bolkar-settings';
const DEFAULT_BACKEND_URL = 'https://bolkar.online';

type AppTab = 'home' | 'history' | 'hotwords';

interface Settings {
  mode: TranscriptionMode | null;
  backendUrl: string;
}

const DEFAULT_SETTINGS: Settings = {
  mode: null,
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

interface DayGroup {
  key: string;
  label: string;
  totalWords: number;
  items: Array<HistoryItem & { wordCount: number }>;
}

// ── Bolkar logo built from pure Views (ring + bars + arcs) ──────────────────
const GOLD = '#d9a930';
function BolkarLogoRN({ size = 28 }: { size?: number }) {
  const s = size;
  const bw = s * 0.075;
  const barHeights = [0.16, 0.26, 0.38, 0.26, 0.16];
  const barW = s * 0.055;
  const barGap = s * 0.025;
  const barsX = s * 0.23;
  return (
    <View style={{ width: s, height: s }}>
      {/* Outer ring */}
      <View style={{ position: 'absolute', width: s, height: s, borderRadius: s / 2, borderWidth: bw, borderColor: GOLD }} />
      {/* Waveform bars */}
      {barHeights.map((h, i) => {
        const bh = s * h;
        return (
          <View key={i} style={{
            position: 'absolute', width: barW, height: bh,
            backgroundColor: GOLD, borderRadius: barW / 2,
            left: barsX + i * (barW + barGap), top: (s - bh) / 2,
          }} />
        );
      })}
      {/* Inner arc — right half of a clipped ellipse */}
      <View style={{ position: 'absolute', left: s * 0.64, top: s * 0.42, width: s * 0.07, height: s * 0.16, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: -s * 0.07, width: s * 0.14, height: s * 0.16, borderRadius: s * 0.07, borderWidth: bw * 0.9, borderColor: GOLD }} />
      </View>
      {/* Outer arc */}
      <View style={{ position: 'absolute', left: s * 0.69, top: s * 0.35, width: s * 0.105, height: s * 0.30, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: -s * 0.105, width: s * 0.21, height: s * 0.30, borderRadius: s * 0.105, borderWidth: bw * 0.8, borderColor: GOLD }} />
      </View>
    </View>
  );
}

function countWords(text: string): number {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  return parts.length;
}

function getDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDayLabel(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function HomeScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [draftUrl, setDraftUrl] = useState(DEFAULT_BACKEND_URL);
  const [isRunning, setIsRunning] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [hotWords, setHotWords] = useState<HotWord[]>([]);
  const [hwLoading, setHwLoading] = useState(false);
  const [draftTrigger, setDraftTrigger] = useState('');
  const [draftReplacement, setDraftReplacement] = useState('');

  const [auth, setAuth] = useState<AuthState>(getAuthState());
  const [authLoading, setAuthLoading] = useState(false);
  const user = auth.user;

  const deviceIdRef = useRef<string>('');

  // Tab transition animation
  const contentOpacity = useRef(new Animated.Value(1)).current;

  // Language cycling animation (tagline)
  const [bolIndex, setBolIndex] = useState(0);
  const bolOpacity = useRef(new Animated.Value(1)).current;
  const bolTranslate = useRef(new Animated.Value(0)).current;

  // Mode label cycling animation
  const [modeLabelIndex, setModeLabelIndex] = useState(0);
  const modeLabelOpacity = useRef(new Animated.Value(1)).current;

  const [sarvamLogoVisible, setSarvamLogoVisible] = useState(true);

  // Use-case carousel animation
  const [useCaseIndex, setUseCaseIndex] = useState(0);
  const [useCaseTimerKey, setUseCaseTimerKey] = useState(0);
  const useCaseIndexRef = useRef(0);
  const useCaseOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initAuth().then(setAuth);
    return onAuthChange(setAuth);
  }, []);

  useEffect(() => {
    (async () => {
      const id = await getDeviceId();
      deviceIdRef.current = id;

      const raw = await AsyncStorage.getItem(SETTINGS_KEY).catch(() => null);
      if (raw) {
        const saved = JSON.parse(raw);
        const savedMode = saved.mode === 'translate' || saved.mode === 'transcribe' ? saved.mode : null;
        const merged: Settings = {
          mode: savedMode,
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

  const apiHeaders = useCallback((): Record<string, string> => {
    if (auth.token) {
      return { Authorization: `Bearer ${auth.token}` };
    }
    return { 'x-device-id': deviceIdRef.current };
  }, [auth.token]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch(`${settings.backendUrl}/api/history`, { headers: apiHeaders() });
      if (res.ok) {
        const data = await res.json();
        console.log('[history] response type:', typeof data, 'isArray:', Array.isArray(data), 'length:', Array.isArray(data) ? data.length : 'N/A', 'raw:', JSON.stringify(data).slice(0, 200));
        setHistory(Array.isArray(data) ? data : []);
      } else {
        const body = await res.text().catch(() => '');
        setHistoryError(`Server returned ${res.status}${body ? ': ' + body.slice(0, 120) : ''}`);
      }
    } catch (e) {
      setHistoryError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setHistoryLoading(false);
    }
  }, [settings.backendUrl, apiHeaders]);

  const clearHistory = useCallback(async () => {
    try {
      await fetch(`${settings.backendUrl}/api/history`, { method: 'DELETE', headers: apiHeaders() });
      setHistory([]);
    } catch {
      // silent
    }
  }, [settings.backendUrl, apiHeaders]);

  const fetchHotWords = useCallback(async () => {
    setHwLoading(true);
    try {
      const res = await fetch(`${settings.backendUrl}/api/hot-words`, { headers: apiHeaders() });
      if (res.ok) setHotWords(await res.json());
    } catch {
      // silent
    } finally {
      setHwLoading(false);
    }
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
    } catch {
      // silent
    }
  }, [settings.backendUrl, apiHeaders, draftTrigger, draftReplacement]);

  const deleteHotWord = useCallback(async (id: string) => {
    try {
      await fetch(`${settings.backendUrl}/api/hot-words?id=${id}`, { method: 'DELETE', headers: apiHeaders() });
      setHotWords((prev) => prev.filter((h) => h.id !== id));
    } catch {
      // silent
    }
  }, [settings.backendUrl, apiHeaders]);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
    if (activeTab === 'hotwords') fetchHotWords();
  }, [activeTab, fetchHistory, fetchHotWords]);

  // Language word cycling
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(bolOpacity, { toValue: 0, duration: 280, useNativeDriver: true }).start();
      Animated.timing(bolTranslate, { toValue: -8, duration: 280, useNativeDriver: true }).start(() => {
        setBolIndex((i) => (i + 1) % BOL_WORDS.length);
        bolTranslate.setValue(8);
        Animated.timing(bolOpacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
        Animated.timing(bolTranslate, { toValue: 0, duration: 280, useNativeDriver: true }).start();
      });
    }, 2200);
    return () => clearInterval(id);
  }, [bolOpacity, bolTranslate]);

  // Mode label cycling
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(modeLabelOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setModeLabelIndex((i) => (i + 1) % MODE_LABELS.length);
        Animated.timing(modeLabelOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 2500);
    return () => clearInterval(id);
  }, [modeLabelOpacity]);

  const switchUseCase = useCallback((i: number) => {
    useCaseIndexRef.current = i;
    Animated.timing(useCaseOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setUseCaseIndex(i);
      setUseCaseTimerKey((k) => k + 1);
      Animated.timing(useCaseOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }, [useCaseOpacity]);

  // Use-case auto-cycling
  useEffect(() => {
    const timer = setTimeout(() => {
      switchUseCase((useCaseIndexRef.current + 1) % USE_CASES.length);
    }, 4500);
    return () => clearTimeout(timer);
  }, [useCaseTimerKey, switchUseCase]);

  const switchTab = useCallback((tab: AppTab) => {
    if (tab === activeTab) return;
    Animated.timing(contentOpacity, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setActiveTab(tab);
      Animated.timing(contentOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }, [activeTab, contentOpacity]);

  const saveSettings = useCallback(async (updated: Settings) => {
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  }, []);

  const chooseMode = useCallback((mode: TranscriptionMode) => {
    saveSettings({ ...settings, mode });
  }, [saveSettings, settings]);

  const handleSaveSettings = async () => {
    const url = draftUrl.trim() || DEFAULT_BACKEND_URL;
    await saveSettings({ ...settings, backendUrl: url });
    setDraftUrl(url);
    setShowSettings(false);
  };

  const handleToggleFloating = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Android only', 'Floating bubble currently works only on Android.');
      return;
    }

    if (isRunning) {
      stopFloating();
      setIsRunning(false);
      return;
    }

    if (!settings.mode) {
      Alert.alert('Select a mode first', 'Choose Translate or Transcribe before creating the floating bubble.');
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
        authToken: auth.token ?? '',
      });
      setIsRunning(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to start floating bubble';
      Alert.alert('Error', msg);
    }
  };

  const mode = settings.mode;
  const cfg = (mode ?? 'translate') === 'translate'
    ? { primary: '#7c3aed', accent: '#6d28d9', bg: '#f3e8ff' }
    : { primary: '#2563eb', accent: '#1d4ed8', bg: '#dbeafe' };

  const groupedHistory = useMemo<DayGroup[]>(() => {
    const map = new Map<string, DayGroup>();

    for (const item of history) {
      const created = new Date(item.createdAt);
      const key = getDayKey(created);
      const wordCount = countWords(item.transcript);

      if (!map.has(key)) {
        map.set(key, {
          key,
          label: getDayLabel(created),
          totalWords: 0,
          items: [],
        });
      }

      const g = map.get(key)!;
      g.totalWords += wordCount;
      g.items.push({ ...item, wordCount });
    }

    return Array.from(map.values())
      .sort((a, b) => (a.key > b.key ? -1 : 1))
      .map((g) => ({
        ...g,
        items: g.items.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)),
      }));
  }, [history]);

  const totalWords = useMemo(
    () => history.reduce((sum, item) => sum + countWords(item.transcript), 0),
    [history]
  );

  const totalSessions = history.length;
  // Time saved: typing at ~40 WPM vs speaking (near-instant). totalWords / 40 = minutes saved.
  const timeSavedMins = Math.round(totalWords / 40);
  const timeSaved = timeSavedMins >= 60
    ? `${Math.floor(timeSavedMins / 60)}h ${timeSavedMins % 60}m`
    : `${timeSavedMins}m`;

  return (
    <View style={styles.root}>
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      <View style={styles.topBar}>
        {/* Left: logo + brand */}
        <View style={styles.brandRow}>
          <BolkarLogoRN size={34} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.brand}>
              <Text>bol</Text>
              <Text style={{ color: '#6d28d9' }}>kar</Text>
            </Text>
          </View>
        </View>

        <View style={styles.topActions}>
          {/* Sarvam badge */}
          <View style={styles.sarvamBadge}>
            <Text style={styles.sarvamBadgeLabel}>Made with</Text>
            {sarvamLogoVisible && (
              <Image
                source={{ uri: 'https://assets.sarvam.ai/assets/pngs/sarvam-logo-white.png' }}
                style={{ width: 40, height: 12, tintColor: 'rgba(15,23,42,0.65)' }}
                resizeMode="contain"
                onError={() => setSarvamLogoVisible(false)}
              />
            )}
            <Text style={styles.sarvamBadgeName}>Sarvam</Text>
          </View>

          {authLoading ? (
            <ActivityIndicator size="small" color={cfg.accent} />
          ) : user ? (
            <TouchableOpacity
              style={styles.accountChip}
              onPress={() => {
                setAuthLoading(true);
                authSignOut(settings.backendUrl).finally(() => setAuthLoading(false));
              }}
            >
              <Text style={styles.accountChipText}>{user.name?.[0]?.toUpperCase() ?? '?'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.signInBtn, { borderColor: cfg.primary }]}
              onPress={() => {
                setAuthLoading(true);
                googleSignIn(settings.backendUrl)
                  .catch((e) => Alert.alert('Sign in failed', e?.message ?? 'Unknown error'))
                  .finally(() => setAuthLoading(false));
              }}
            >
              <Text style={[styles.signInText, { color: cfg.accent }]}>Sign in</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettings((s) => !s)}>
            <Text style={styles.settingsText}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabRow}>
        {([
          { key: 'home', label: 'Home' },
          { key: 'history', label: 'History' },
          { key: 'hotwords', label: 'Hot Words' },
        ] as const).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => switchTab(tab.key)}
              style={[styles.tabBtn, active && { backgroundColor: cfg.primary }]}
            >
              <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: cfg.primary }]} onPress={handleSaveSettings}>
            <Text style={styles.primaryBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Animated.View style={{ opacity: contentOpacity }}>
        {activeTab === 'home' && (
          <>
            {/* Animated language tagline */}
            <View style={styles.taglineCard}>
              <Text style={styles.taglineDontType}>Don't type, just</Text>
              <Animated.View style={[styles.taglineWordWrap, { opacity: bolOpacity, transform: [{ translateY: bolTranslate }] }]}>
                <Text style={[styles.taglineWord, { color: cfg.primary }]}>{BOL_WORDS[bolIndex].text}</Text>
                <Text style={styles.taglineLang}>{BOL_WORDS[bolIndex].lang}</Text>
              </Animated.View>
            </View>

            <View style={[styles.heroCard, { borderColor: `${cfg.primary}55`, backgroundColor: `${cfg.bg}cc` }]}>
              <Text style={styles.heroEyebrow}>Get Started</Text>
              <Text style={styles.heroTitle}>Your mic, everywhere you type</Text>
              <Text style={styles.heroSubtitle}>
                Pick a mode, create your floating bubble, and start speaking.
              </Text>

              <View style={styles.modeGrid}>
                <TouchableOpacity
                  style={[
                    styles.modeCard,
                    mode === 'translate' && { borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.2)' },
                  ]}
                  onPress={() => chooseMode('translate')}
                >
                  <Animated.Text style={[styles.modeCardTitle, { opacity: modeLabelOpacity }]}>
                    {MODE_LABELS[modeLabelIndex].toEnglish}
                  </Animated.Text>
                  <Text style={styles.modeCardHint}>Any Indian language → English</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeCard,
                    mode === 'transcribe' && { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)' },
                  ]}
                  onPress={() => chooseMode('transcribe')}
                >
                  <Animated.Text style={[styles.modeCardTitle, { opacity: modeLabelOpacity }]}>
                    {MODE_LABELS[modeLabelIndex].asSpoken}
                  </Animated.Text>
                  <Text style={styles.modeCardHint}>Keep original spoken language</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.micLaunch,
                  { borderColor: `${cfg.primary}88` },
                  !mode && { opacity: 0.7 },
                ]}
                onPress={handleToggleFloating}
              >
                <View style={[styles.micOrb, { backgroundColor: isRunning ? colors.recordingRed : cfg.primary }]}>
                  <Text style={styles.micIcon}>🎤</Text>
                </View>
                <Text style={styles.micLaunchTitle}>{isRunning ? 'Stop Floating Bubble' : 'Create Floating Bubble'}</Text>
                <Text style={styles.micLaunchHint}>
                  {mode
                    ? `Mode selected: ${mode === 'translate' ? 'To English' : 'As Spoken'}`
                    : 'Select one mode to continue'}
                </Text>
              </TouchableOpacity>

              {Platform.OS === 'android' && (
                <TouchableOpacity style={styles.permissionLink} onPress={() => Linking.openSettings()}>
                  <Text style={styles.permissionLinkText}>Need overlay permission? Open Android settings</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Works for how you already speak */}
            <View style={styles.worksSection}>
              <Text style={styles.worksSectionLabel}>Who it's for</Text>
              <Text style={styles.worksSectionTitle}>Works for how you already speak.</Text>

              {/* Persona chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.personaChipsRow}>
                {USE_CASES.map((uc, i) => {
                  const isActive = useCaseIndex === i;
                  return (
                    <TouchableOpacity
                      key={uc.id}
                      onPress={() => switchUseCase(i)}
                      style={[styles.personaChip, isActive && { backgroundColor: uc.color, borderColor: uc.color }]}
                    >
                      <Text style={[styles.personaChipText, isActive && styles.personaChipTextActive]}>
                        {uc.emoji} {uc.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Animated card */}
              <Animated.View
                style={[
                  styles.useCaseCard,
                  {
                    opacity: useCaseOpacity,
                    borderLeftColor: USE_CASES[useCaseIndex].color,
                  },
                ]}
              >
                {/* Header */}
                <View style={styles.useCaseHeader}>
                  <View style={[styles.useCaseEmojiBox, { borderColor: USE_CASES[useCaseIndex].colorBorder }]}>
                    <Text style={styles.useCaseEmoji}>{USE_CASES[useCaseIndex].emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.useCaseName, { color: USE_CASES[useCaseIndex].colorText }]}>
                      {USE_CASES[useCaseIndex].label}
                    </Text>
                    <Text style={[styles.useCaseSub, { color: USE_CASES[useCaseIndex].color }]}>
                      {USE_CASES[useCaseIndex].sublabel}
                    </Text>
                  </View>
                </View>

                {/* You say */}
                <View style={styles.useCaseBeforeBox}>
                  <Text style={[styles.useCaseBoxLabel, { color: USE_CASES[useCaseIndex].colorText }]}>
                    🎤  You say · {USE_CASES[useCaseIndex].language}
                  </Text>
                  <Text style={styles.useCaseBeforeText}>
                    "{USE_CASES[useCaseIndex].before}"
                  </Text>
                </View>

                {/* Arrow */}
                <Text style={[styles.useCaseArrow, { color: USE_CASES[useCaseIndex].color }]}>↓</Text>

                {/* Bolkar outputs */}
                <View style={[styles.useCaseAfterBox, { borderColor: USE_CASES[useCaseIndex].colorBorder }]}>
                  <Text style={[styles.useCaseBoxLabel, { color: USE_CASES[useCaseIndex].colorText }]}>
                    ✓  Bolkar outputs · English
                  </Text>
                  <Text style={styles.useCaseAfterText}>{USE_CASES[useCaseIndex].after}</Text>
                </View>
              </Animated.View>
            </View>
          </>
        )}

        {activeTab === 'history' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>History Insights</Text>
              <View style={styles.inlineActions}>
                <TouchableOpacity onPress={fetchHistory}>
                  <Text style={styles.smallAction}>Refresh</Text>
                </TouchableOpacity>
                {history.length > 0 && (
                  <TouchableOpacity onPress={clearHistory}>
                    <Text style={styles.smallDanger}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Words</Text>
                <Text style={styles.metricValueLarge}>{totalWords.toLocaleString()}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Sessions</Text>
                <Text style={styles.metricValueLarge}>{totalSessions}</Text>
              </View>
            </View>
            <View style={styles.timeSavedCard}>
              <View>
                <Text style={styles.metricLabel}>⏱ Time Saved</Text>
                <Text style={styles.timeSavedValue}>{timeSaved}</Text>
                <Text style={styles.timeSavedHint}>vs typing at 40 WPM</Text>
              </View>
            </View>

            {historyLoading ? (
              <ActivityIndicator color={cfg.accent} style={{ marginTop: 24 }} />
            ) : historyError ? (
              <Text style={styles.errorText}>{historyError}</Text>
            ) : groupedHistory.length === 0 ? (
              <Text style={styles.emptyText}>No transcriptions yet. Create a floating bubble and start speaking.</Text>
            ) : (
              groupedHistory.map((group) => (
                <View key={group.key} style={styles.dayBlock}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{group.label}</Text>
                    <Text style={styles.dayWords}>{group.totalWords} words</Text>
                  </View>

                  {group.items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.historyRow}
                      onPress={() => Clipboard.setStringAsync(item.transcript)}
                    >
                      <Text style={styles.historyTranscript} numberOfLines={3}>{item.transcript}</Text>
                      <View style={styles.historyMetaRow}>
                        <Text style={styles.historyMeta}>
                          {item.mode === 'translate' ? 'To English' : 'As Spoken'}
                        </Text>
                        <Text style={styles.historyMeta}>{item.wordCount} words</Text>
                        <Text style={styles.historyMeta}>{timeAgo(new Date(item.createdAt).getTime())}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'hotwords' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Hot Words</Text>
            <Text style={styles.sectionSubtitle}>
              Add trigger phrases and automatic replacements for cleaner mobile transcripts.
            </Text>

            <View style={styles.hotWordComposer}>
              <TextInput
                style={styles.input}
                value={draftTrigger}
                onChangeText={setDraftTrigger}
                placeholder="Trigger phrase"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                value={draftReplacement}
                onChangeText={setDraftReplacement}
                placeholder="Replacement text"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: cfg.primary },
                  (!draftTrigger.trim() || !draftReplacement.trim()) && { opacity: 0.6 },
                ]}
                onPress={addHotWord}
                disabled={!draftTrigger.trim() || !draftReplacement.trim()}
              >
                <Text style={styles.primaryBtnText}>Add Hot Word</Text>
              </TouchableOpacity>
            </View>

            {hwLoading ? (
              <ActivityIndicator color={cfg.accent} style={{ marginTop: 20 }} />
            ) : hotWords.length === 0 ? (
              <Text style={styles.emptyText}>No hot words yet.</Text>
            ) : (
              hotWords.map((hw) => (
                <View key={hw.id} style={styles.hotWordRow}>
                  <View style={styles.hotWordTextWrap}>
                    <Text style={styles.hotWordTrigger}>“{hw.trigger}”</Text>
                    <Text style={styles.hotWordReplacement}>→ {hw.replacement}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteHotWord(hw.id)}>
                    <Text style={styles.smallDanger}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  bgGlowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(37,99,235,0.12)',
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: 'rgba(124,58,237,0.12)',
  },
  topBar: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    color: '#0f172a',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sarvamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(15,23,42,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.14)',
  },
  sarvamBadgeLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '500',
  },
  sarvamBadgeName: {
    color: '#0f172a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  accountChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  accountChipText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  signInBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
  },
  signInText: {
    fontSize: 13,
    fontWeight: '700',
  },
  settingsBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
  },
  settingsText: {
    color: '#334155',
    fontSize: 16,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 4,
    borderRadius: radius.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    borderRadius: radius.full,
    paddingVertical: 9,
    alignItems: 'center',
  },
  tabBtnText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  settingsPanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
  },
  heroEyebrow: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  heroTitle: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 31,
    marginTop: 8,
  },
  heroSubtitle: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  modeGrid: {
    marginTop: 14,
    gap: 10,
  },
  modeCard: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  modeCardTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  modeCardHint: {
    color: '#475569',
    fontSize: 12,
    marginTop: 4,
  },
  micLaunch: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  micOrb: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  micIcon: {
    fontSize: 32,
  },
  micLaunchTitle: {
    marginTop: 10,
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  micLaunchHint: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 12,
  },
  permissionLink: {
    marginTop: 10,
    alignItems: 'center',
  },
  permissionLinkText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  valueCard: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  valueLinePrimary: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  valueLineSecondary: {
    color: '#475569',
    fontSize: 13,
    marginTop: 4,
  },
  worksSection: {
    marginTop: 24,
  },
  worksSectionLabel: {
    color: '#5b21b6',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  worksSectionTitle: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 29,
    marginBottom: 16,
  },
  personaChipsRow: {
    gap: 8,
    paddingBottom: 4,
  },
  personaChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(15,23,42,0.12)',
    backgroundColor: 'rgba(15,23,42,0.04)',
  },
  personaChipText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 13,
  },
  personaChipTextActive: {
    color: '#ffffff',
  },
  useCaseCard: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.10)',
    borderLeftWidth: 4,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  useCaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  useCaseEmojiBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.06)',
    borderWidth: 1,
    flexShrink: 0,
  },
  useCaseEmoji: {
    fontSize: 22,
  },
  useCaseName: {
    fontSize: 15,
    fontWeight: '700',
  },
  useCaseSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  useCaseBeforeBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.10)',
    backgroundColor: 'rgba(15,23,42,0.03)',
    padding: 12,
    marginTop: 4,
  },
  useCaseAfterBox: {
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    padding: 12,
  },
  useCaseBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  useCaseBeforeText: {
    color: '#334155',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  useCaseAfterText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  useCaseArrow: {
    textAlign: 'center',
    fontSize: 18,
    paddingVertical: 6,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 10,
  },
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  smallAction: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  smallDanger: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  metricValueLarge: {
    color: '#0f172a',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  timeSavedCard: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(109,40,217,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(109,40,217,0.25)',
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  timeSavedValue: {
    color: '#5b21b6',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  timeSavedHint: {
    color: '#7c3aed',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.8,
  },
  dayBlock: {
    marginTop: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTitle: {
    color: '#1e293b',
    fontSize: 13,
    fontWeight: '700',
  },
  dayWords: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  historyRow: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    padding: 12,
    marginBottom: 8,
  },
  historyTranscript: {
    color: '#0f172a',
    fontSize: 14,
    lineHeight: 20,
  },
  historyMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 12,
  },
  historyMeta: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  hotWordComposer: {
    marginTop: 10,
  },
  hotWordRow: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  hotWordTextWrap: {
    flex: 1,
  },
  hotWordTrigger: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  hotWordReplacement: {
    color: '#475569',
    marginTop: 3,
    fontSize: 13,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 18,
    lineHeight: 19,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 18,
    lineHeight: 18,
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Menlo',
  },
  taglineCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 4,
  },
  taglineDontType: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  taglineWordWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  taglineWord: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 58,
  },
  taglineLang: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2,
  },
  label: {
    color: '#475569',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#0f172a',
    fontSize: 14,
    marginBottom: 10,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
