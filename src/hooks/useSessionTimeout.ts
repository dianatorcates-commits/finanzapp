import { useEffect, useRef, useState, useCallback } from 'react';

export const DEFAULT_SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes (900,000 ms)
export const DEFAULT_WARNING_BEFORE_TIMEOUT_MS = 60 * 1000; // 60 seconds warning before logout
const LAST_ACTIVITY_STORAGE_KEY = 'finanzapp_last_activity_ts';
const ACTIVITY_WRITE_THROTTLE_MS = 2000;

export interface UseSessionTimeoutOptions {
  /** Whether the user currently has an active authenticated session */
  isAuthenticated: boolean;
  /** Callback executed when the inactivity limit is exceeded */
  onTimeout: () => void | Promise<void>;
  /** Total inactivity duration before automatic logout in milliseconds (default: 15 min) */
  timeoutMs?: number;
  /** How many milliseconds before timeout to display the warning modal (default: 60s) */
  warningMs?: number;
}

export interface UseSessionTimeoutReturn {
  /** True during the final warning window before auto-logout */
  isWarningOpen: boolean;
  /** Remaining seconds until auto-logout */
  remainingSeconds: number;
  /** Explicitly resets the inactivity timer and closes any warning modal */
  extendSession: () => void;
}

/**
 * Monitors user activity (touch, scroll, click, keyboard) and page visibility
 * to enforce automatic logout after a period of inactivity (fintech security standard).
 */
export function useSessionTimeout({
  isAuthenticated,
  onTimeout,
  timeoutMs = DEFAULT_SESSION_TIMEOUT_MS,
  warningMs = DEFAULT_WARNING_BEFORE_TIMEOUT_MS
}: UseSessionTimeoutOptions): UseSessionTimeoutReturn {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(Math.ceil(warningMs / 1000));

  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const isWarningOpenRef = useRef(isWarningOpen);
  isWarningOpenRef.current = isWarningOpen;

  const lastActivityRef = useRef<number>(Date.now());
  const lastStorageWriteRef = useRef<number>(0);
  const hasTimedOutRef = useRef<boolean>(false);
  const wasAuthenticatedRef = useRef<boolean>(false);

  const persistLastActivity = useCallback((timestamp: number, force = false) => {
    const now = Date.now();
    if (!force && now - lastStorageWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) {
      return;
    }
    lastStorageWriteRef.current = now;
    try {
      localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(timestamp));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const clearStoredActivity = useCallback(() => {
    try {
      localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const triggerTimeout = useCallback(() => {
    if (hasTimedOutRef.current) return;
    hasTimedOutRef.current = true;
    setIsWarningOpen(false);
    clearStoredActivity();
    void onTimeoutRef.current();
  }, [clearStoredActivity]);

  const extendSession = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    hasTimedOutRef.current = false;
    setIsWarningOpen(false);
    setRemainingSeconds(Math.ceil(warningMs / 1000));
    persistLastActivity(now, true);
  }, [persistLastActivity, warningMs]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Only clear persisted timestamp if transitioning from an active session to signed out
      if (wasAuthenticatedRef.current) {
        clearStoredActivity();
      }
      wasAuthenticatedRef.current = false;
      hasTimedOutRef.current = false;
      setIsWarningOpen(false);
      return;
    }

    wasAuthenticatedRef.current = true;
    hasTimedOutRef.current = false;

    // On session activation, check if a stale timestamp exists from a suspended PWA/tab
    let initialTimestamp = Date.now();
    try {
      const stored = localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY);
      if (stored) {
        const parsed = Number(stored);
        if (Number.isFinite(parsed) && parsed > 0) {
          initialTimestamp = parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }

    lastActivityRef.current = initialTimestamp;
    if (Date.now() - initialTimestamp >= timeoutMs) {
      triggerTimeout();
      return;
    }

    // Ensure storage has a valid timestamp for this active session
    persistLastActivity(initialTimestamp, true);

    const checkInactivity = () => {
      if (hasTimedOutRef.current) return;

      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= timeoutMs) {
        triggerTimeout();
        return;
      }

      const warningThreshold = Math.max(0, timeoutMs - warningMs);
      if (warningMs > 0 && elapsed >= warningThreshold) {
        const secsLeft = Math.max(1, Math.ceil((timeoutMs - elapsed) / 1000));
        setRemainingSeconds(secsLeft);
        if (!isWarningOpenRef.current) {
          setIsWarningOpen(true);
        }
      } else if (isWarningOpenRef.current) {
        setIsWarningOpen(false);
      }
    };

    const handleUserActivity = () => {
      if (hasTimedOutRef.current) return;
      // Once the final warning modal is shown, require explicit confirmation via extendSession()
      if (isWarningOpenRef.current) return;

      const now = Date.now();
      lastActivityRef.current = now;
      persistLastActivity(now);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };

    const activityEvents: Array<keyof DocumentEventMap> = [
      'touchstart',
      'touchend',
      'scroll',
      'click',
      'mousedown',
      'keydown'
    ];

    activityEvents.forEach((evt) => {
      document.addEventListener(evt, handleUserActivity, { passive: true, capture: true });
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkInactivity);

    const intervalId = window.setInterval(checkInactivity, 1000);

    return () => {
      activityEvents.forEach((evt) => {
        document.removeEventListener(evt, handleUserActivity, { capture: true });
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkInactivity);
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, timeoutMs, warningMs, persistLastActivity, clearStoredActivity, triggerTimeout]);

  return {
    isWarningOpen,
    remainingSeconds,
    extendSession
  };
}
