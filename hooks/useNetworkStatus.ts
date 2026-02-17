import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const CHECK_URL = 'https://clients3.google.com/generate_204';
const CHECK_INTERVAL = 15_000; // 15 seconds
const TIMEOUT_MS = 5_000;

async function checkConnectivity(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(CHECK_URL, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    return res.status < 500;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    const online = await checkConnectivity();
    setIsOnline(online);
  }, []);

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, CHECK_INTERVAL);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, [check]);

  return { isOnline };
}
