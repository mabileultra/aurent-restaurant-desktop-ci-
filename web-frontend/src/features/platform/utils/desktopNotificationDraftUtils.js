export const DRAFT_STORAGE_KEY = 'aurent_desktop_notification_draft_v1';

export function restoreDraftFromStorage(saved, setters) {
  if (!saved) return false;
  try {
    const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
    const restoredTitle = parsed.title || parsed.titleUz || '';
    const restoredBody = parsed.body || parsed.bodyUz || '';

    // Only restore meaningful content (title or body).
    // Phantom IDs or 'SELECT' / 'SCHEDULED' from legacy drafts must not trigger draft restoration notice.
    const hasMeaningfulContent = Boolean(restoredTitle?.trim() || restoredBody?.trim());

    if (restoredTitle) setters.setTitle?.(restoredTitle);
    if (restoredBody) setters.setBody?.(restoredBody);
    if (parsed.kind) setters.setKind?.(parsed.kind);
    if (parsed.duration) setters.setDuration?.(parsed.duration);
    if (parsed.customHours) setters.setCustomHours?.(parsed.customHours);

    // Targeting: 'SELECT' is a 'Tez kunda' feature.
    // Force 'ALL' and clear any phantom company/store selections.
    setters.setTargetScope?.('ALL');
    setters.setTargetType?.('COMPANIES');
    setters.setSelectedCompanyIds?.([]);
    setters.setSelectedStoreIds?.([]);
    setters.setSelectedCompanies?.([]);
    setters.setSelectedStores?.([]);

    // Scheduling: 'SCHEDULED' is a 'Tez kunda' feature.
    // Force 'NOW' and reset scheduled date/time.
    setters.setScheduleType?.('NOW');
    setters.setScheduleDate?.('');
    setters.setScheduleTime?.('09:00');

    return hasMeaningfulContent;
  } catch {
    return false;
  }
}

export function serializeDraftToStorage(state) {
  const hasData = Boolean(
    state.title?.trim() ||
    state.body?.trim()
  );

  if (!hasData) return null;

  return JSON.stringify({
    title: state.title,
    body: state.body,
    kind: state.kind,
    duration: state.duration,
    customHours: state.customHours,
    // Always store safe defaults for 'Tez kunda' features
    targetScope: 'ALL',
    targetType: 'COMPANIES',
    selectedCompanyIds: [],
    selectedStoreIds: [],
    selectedCompanies: [],
    selectedStores: [],
    scheduleType: 'NOW',
    scheduleDate: '',
    scheduleTime: '',
  });
}
