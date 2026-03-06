import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'bolkar-device-id';

let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;

  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY).catch(() => null);
  if (stored) {
    cached = stored;
    return stored;
  }

  // Generate a new UUID
  const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  await AsyncStorage.setItem(DEVICE_ID_KEY, id).catch(() => {});
  cached = id;
  return id;
}
