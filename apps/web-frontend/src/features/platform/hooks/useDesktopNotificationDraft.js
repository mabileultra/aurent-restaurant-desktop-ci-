import { useEffect, useRef, useState } from 'react';
import {
  DRAFT_STORAGE_KEY,
  restoreDraftFromStorage,
  serializeDraftToStorage,
} from '../utils/desktopNotificationDraftUtils';

export function useDesktopNotificationDraft({
  title,
  setTitle,
  body,
  setBody,
  kind,
  setKind,
  duration,
  setDuration,
  customHours,
  setCustomHours,
  targetScope,
  setTargetScope,
  targetType,
  setTargetType,
  selectedCompanyIds,
  setSelectedCompanyIds,
  selectedStoreIds,
  setSelectedStoreIds,
  selectedCompanies,
  setSelectedCompanies,
  selectedStores,
  setSelectedStores,
  scheduleType,
  setScheduleType,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
}) {
  const [draftSaved, setDraftSaved] = useState(true);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [isTargetingReset, setIsTargetingReset] = useState(false);
  const draftTimerRef = useRef(null);
  const isInitialMountRef = useRef(true);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      const isRestored = restoreDraftFromStorage(saved, {
        setTitle,
        setBody,
        setKind,
        setDuration,
        setCustomHours,
        setTargetScope,
        setTargetType,
        setSelectedCompanyIds,
        setSelectedStoreIds,
        setSelectedCompanies,
        setSelectedStores,
        setScheduleType,
        setScheduleDate,
        setScheduleTime,
        setIsTargetingReset,
      });

      if (isRestored) {
        setIsDraftRestored(true);
      }
    } catch {
      // ignore storage error
    }
  }, [
    setTitle,
    setBody,
    setKind,
    setDuration,
    setCustomHours,
    setTargetScope,
    setTargetType,
    setSelectedCompanyIds,
    setSelectedStoreIds,
    setSelectedCompanies,
    setSelectedStores,
    setScheduleType,
    setScheduleDate,
    setScheduleTime,
  ]);

  // Auto-save draft on changes (debounced 600ms)
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    setDraftSaved(false);
    clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      try {
        const serialized = serializeDraftToStorage({
          title,
          body,
          kind,
          duration,
          customHours,
          targetScope,
          targetType,
          selectedCompanyIds,
          selectedStoreIds,
          selectedCompanies,
          selectedStores,
          scheduleType,
          scheduleDate,
          scheduleTime,
        });

        if (!serialized) {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } else {
          localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
        }
        setDraftSaved(true);
      } catch {
        // ignore storage error
      }
    }, 600);
    return () => clearTimeout(draftTimerRef.current);
  }, [
    title,
    body,
    kind,
    duration,
    customHours,
    targetScope,
    targetType,
    selectedCompanyIds,
    selectedStoreIds,
    selectedCompanies,
    selectedStores,
    scheduleType,
    scheduleDate,
    scheduleTime,
  ]);

  const clearDraftStorage = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setIsTargetingReset(false);
    } catch {
      // ignore
    }
  };

  return {
    draftSaved,
    isDraftRestored,
    setIsDraftRestored,
    isTargetingReset,
    setIsTargetingReset,
    clearDraftStorage,
    handleDismissDraftNotice: () => {
      setIsDraftRestored(false);
      setIsTargetingReset(false);
    },
  };
}

export { DRAFT_STORAGE_KEY, restoreDraftFromStorage, serializeDraftToStorage };
