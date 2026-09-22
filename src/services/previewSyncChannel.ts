/**
 * previewSyncChannel.ts
 * Real-time zero-delay cross-tab & cloud synchronization engine for public link previews.
 * Uses BroadcastChannel + Storage Events for 0ms instantaneous preview updates
 * alongside Firestore onSnapshot real-time streaming.
 */

export type PreviewSyncType = 'nilai' | 'absensi' | 'tabungan';

export interface PreviewSyncPayload {
  type: PreviewSyncType;
  shareId: string;
  classId?: string;
  data: any;
  timestamp: number;
}

const CHANNEL_NAME = 'smk_preview_instant_sync_channel';

// Singleton BroadcastChannel instance
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (err) {
    console.warn('[PreviewSync] BroadcastChannel init notice:', err);
  }
}

/**
 * Broadcast an instant update from dashboard to all active preview tabs/windows.
 * Updates localStorage caches (0ms) and broadcasts over BroadcastChannel.
 */
export function broadcastPreviewUpdate(
  type: PreviewSyncType,
  shareId: string,
  classId: string | undefined,
  data: any
): void {
  if (typeof window === 'undefined') return;

  const prefix = type === 'nilai' ? 'nil' : type === 'absensi' ? 'abs' : 'tb';
  const cleanClass = classId ? classId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
  const cleanClassNoHyphen = classId ? classId.replace(/[^a-zA-Z0-9]/g, '') : '';

  // 1. Instant local storage cache writes for 0ms page delivery
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(`cache_pub_${prefix}_${shareId}`, serialized);
    if (cleanClass) {
      localStorage.setItem(`cache_pub_${prefix}_${prefix}_${cleanClass}`, serialized);
    }
    if (cleanClassNoHyphen && cleanClassNoHyphen !== cleanClass) {
      localStorage.setItem(`cache_pub_${prefix}_${prefix}_${cleanClassNoHyphen}`, serialized);
    }
    // Ping storage event listeners
    localStorage.setItem(
      'smk_preview_sync_ping',
      JSON.stringify({ type, shareId, classId, timestamp: Date.now() })
    );
  } catch (err) {
    console.warn('[PreviewSync] LocalStorage cache write notice:', err);
  }

  // 2. BroadcastChannel instant message across tabs
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type,
        shareId,
        classId,
        data,
        timestamp: Date.now(),
      } as PreviewSyncPayload);
    } catch (err) {
      console.warn('[PreviewSync] BroadcastChannel postMessage notice:', err);
    }
  }
}

/**
 * Subscribe to instant preview updates in preview view components.
 * Listens to BroadcastChannel and window storage events.
 */
export function subscribeToPreviewSync(
  type: PreviewSyncType,
  shareId: string,
  onUpdate: (data: any) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const prefix = type === 'nilai' ? 'nil' : type === 'absensi' ? 'abs' : 'tb';

  // Check if a shareId or classId matches
  const isMatch = (incomingShareId?: string, incomingClassId?: string) => {
    if (!incomingShareId && !incomingClassId) return false;
    if (incomingShareId === shareId) return true;
    if (incomingClassId) {
      const cleanC = incomingClassId.replace(/[^a-zA-Z0-9_-]/g, '');
      if (shareId === `${prefix}_${cleanC}` || shareId.endsWith(`_${cleanC}`)) return true;
    }
    if (incomingShareId && shareId.includes('_')) {
      const targetParts = shareId.split('_');
      const incomingParts = incomingShareId.split('_');
      if (targetParts[targetParts.length - 1] === incomingParts[incomingParts.length - 1]) {
        return true;
      }
    }
    return false;
  };

  // 1. BroadcastChannel message listener
  let bcListener: ((ev: MessageEvent) => void) | null = null;
  if (broadcastChannel) {
    bcListener = (ev: MessageEvent) => {
      const payload = ev.data as PreviewSyncPayload;
      if (payload && payload.type === type && isMatch(payload.shareId, payload.classId)) {
        if (payload.data) {
          onUpdate(payload.data);
        }
      }
    };
    broadcastChannel.addEventListener('message', bcListener);
  }

  // 2. Storage event listener (fallback & cross-window updates)
  const storageListener = (ev: StorageEvent) => {
    if (ev.key === `cache_pub_${prefix}_${shareId}` && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue);
        onUpdate(parsed);
      } catch {}
    } else if (ev.key === 'smk_preview_sync_ping' && ev.newValue) {
      try {
        const ping = JSON.parse(ev.newValue);
        if (ping.type === type && isMatch(ping.shareId, ping.classId)) {
          const cached = localStorage.getItem(`cache_pub_${prefix}_${shareId}`);
          if (cached) {
            onUpdate(JSON.parse(cached));
          }
        }
      } catch {}
    }
  };
  window.addEventListener('storage', storageListener);

  return () => {
    if (broadcastChannel && bcListener) {
      broadcastChannel.removeEventListener('message', bcListener);
    }
    window.removeEventListener('storage', storageListener);
  };
}
