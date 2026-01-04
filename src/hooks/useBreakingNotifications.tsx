import { useEffect, useRef, useCallback } from 'react';
import { readJSONFromStorage, writeJSONToStorage } from '@/lib/async';

const NOTIFICATION_PERMISSION_KEY = 'nn_notification_permission';
const SEEN_BREAKING_IDS_KEY = 'nn_seen_breaking_ids';
const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

interface BreakingArticle {
  id: string;
  title: string;
  slug: string;
  category?: { slug?: string } | null;
}

export function useBreakingNotifications(breakingArticles: BreakingArticle[]) {
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // Load seen IDs from storage on mount
  useEffect(() => {
    const stored = readJSONFromStorage<string[]>(SEEN_BREAKING_IDS_KEY);
    if (stored) {
      seenIdsRef.current = new Set(stored);
    }
    initializedRef.current = true;
  }, []);

  // Check for new breaking news and notify
  useEffect(() => {
    if (!initializedRef.current) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const newBreaking = breakingArticles.filter(
      (article) => !seenIdsRef.current.has(article.id)
    );

    if (newBreaking.length > 0) {
      // Mark as seen
      newBreaking.forEach((article) => seenIdsRef.current.add(article.id));
      writeJSONToStorage(SEEN_BREAKING_IDS_KEY, Array.from(seenIdsRef.current));

      // Show notification for the most recent one
      const latest = newBreaking[0];
      try {
        const notification = new Notification('🔴 Breaking News', {
          body: latest.title,
          icon: '/favicon.ico',
          tag: 'breaking-news',
          requireInteraction: false,
        });

        notification.onclick = () => {
          const categorySlug = latest.category?.slug || 'world';
          window.focus();
          window.location.href = `/${categorySlug}/${latest.slug}`;
        };
      } catch (e) {
        console.error('Failed to show notification:', e);
      }
    }
  }, [breakingArticles]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      writeJSONToStorage(NOTIFICATION_PERMISSION_KEY, 'granted');
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const result = await Notification.requestPermission();
    writeJSONToStorage(NOTIFICATION_PERMISSION_KEY, result);
    return result;
  }, []);

  const permissionStatus = typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'unsupported';

  return {
    requestPermission,
    permissionStatus,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
  };
}

export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}
