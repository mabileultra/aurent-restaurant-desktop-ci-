import { useEffect, useRef, useState } from 'react';

const DRAFT_STORAGE_KEY = 'aurent_desktop_notification_draft_v1';

export function useDesktopNotificationDraft({ title, setTitle, body, setBody, kind, setKind, duration, setDuration, customHours, setCustomHours }) {
  const [draftSaved, setDraftSaved] = useState(true);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const draftTimerRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      const restoredTitle = parsed.title || parsed.titleUz || '';
      const restoredBody = parsed.body || parsed.bodyUz || '';
      if (restoredTitle || restoredBody) {
        setTitle(restoredTitle);
        setBody(restoredBody);
        setIsDraftRestored(true);
      }
      if (parsed.kind) setKind(parsed.kind);
      if (parsed.duration) setDuration(parsed.duration);
      if (parsed.customHours) setCustomHours(parsed.customHours);
    } catch {
      // ignore
    }
  }, [setTitle, setBody, setKind, setDuration, setCustomHours]);

  useEffect(() => {
    setDraftSaved(false);
    clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      try {
        if (!title.trim() && !body.trim()) {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } else {
          localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({ title, body, kind, duration, customHours })
          );
        }
        setDraftSaved(true);
      } catch {
        // ignore
      }
    }, 600);
    return () => clearTimeout(draftTimerRef.current);
  }, [title, body, kind, duration, customHours]);

  const clearDraftStorage = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return {
    draftSaved,
    isDraftRestored,
    setIsDraftRestored,
    clearDraftStorage,
    handleDismissDraftNotice: () => setIsDraftRestored(false),
  };
}

export { DRAFT_STORAGE_KEY };
