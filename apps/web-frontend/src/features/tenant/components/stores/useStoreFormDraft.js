import { useEffect, useMemo, useState } from 'react';
import {
  readStoredStoreDraft,
  saveStoredStoreDraft,
  removeStoredStoreDraft,
} from '../../utils/storeFormDraftUtils';
import { buildDefaultStoreValues } from './storeFormSchema';

/**
 * Manages draft state persistence for the store/branch creation form.
 */
export function useStoreFormDraft({ open, isCreate, initial, reset, watchedValues }) {
  const initialDraft = useMemo(
    () => (open && isCreate ? readStoredStoreDraft() : null),
    [open, isCreate]
  );
  const [isDraftRestored, setIsDraftRestored] = useState(Boolean(initialDraft));

  useEffect(() => {
    if (!open || !isCreate) return undefined;
    const timer = setTimeout(() => saveStoredStoreDraft(watchedValues), 400);
    return () => clearTimeout(timer);
  }, [open, isCreate, watchedValues]);

  useEffect(() => {
    if (!open) {
      setIsDraftRestored(false);
      return;
    }
    const draft = isCreate ? readStoredStoreDraft() : null;
    reset(draft ? { ...buildDefaultStoreValues(initial), ...draft } : buildDefaultStoreValues(initial));
    setIsDraftRestored(Boolean(draft));
  }, [open, initial, isCreate, reset]);

  const handleClearDraft = () => {
    removeStoredStoreDraft();
    setIsDraftRestored(false);
    reset(buildDefaultStoreValues(null));
  };

  const clearDraftOnSuccess = () => {
    removeStoredStoreDraft();
    setIsDraftRestored(false);
  };

  return {
    initialDraft,
    isDraftRestored,
    handleClearDraft,
    clearDraftOnSuccess,
  };
}
