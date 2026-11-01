export const DRAFT_STORAGE_KEY = 'aurent_desktop_notification_draft_v1';

export function restoreDraftFromStorage(saved, setters) {
  if (!saved) return false;
  try {
    const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
    const restoredTitle = parsed.title || parsed.titleUz || '';
    const restoredBody = parsed.body || parsed.bodyUz || '';
    const hasMeaningfulContent = Boolean(
      restoredTitle ||
      restoredBody ||
      parsed.targetScope === 'SELECT' ||
      parsed.scheduleType === 'SCHEDULED' ||
      (Array.isArray(parsed.selectedCompanyIds) && parsed.selectedCompanyIds.length > 0) ||
      (Array.isArray(parsed.selectedStoreIds) && parsed.selectedStoreIds.length > 0)
    );

    if (restoredTitle) setters.setTitle?.(restoredTitle);
    if (restoredBody) setters.setBody?.(restoredBody);
    if (parsed.kind) setters.setKind?.(parsed.kind);
    if (parsed.duration) setters.setDuration?.(parsed.duration);
    if (parsed.customHours) setters.setCustomHours?.(parsed.customHours);

    // Targeting restoration
    if (parsed.targetScope) setters.setTargetScope?.(parsed.targetScope);
    if (parsed.targetType) setters.setTargetType?.(parsed.targetType);
    if (Array.isArray(parsed.selectedCompanyIds)) setters.setSelectedCompanyIds?.(parsed.selectedCompanyIds);
    if (Array.isArray(parsed.selectedStoreIds)) setters.setSelectedStoreIds?.(parsed.selectedStoreIds);
    if (Array.isArray(parsed.selectedCompanies)) setters.setSelectedCompanies?.(parsed.selectedCompanies);
    if (Array.isArray(parsed.selectedStores)) setters.setSelectedStores?.(parsed.selectedStores);

    // Scheduling restoration
    if (parsed.scheduleType) setters.setScheduleType?.(parsed.scheduleType);
    if (parsed.scheduleDate) setters.setScheduleDate?.(parsed.scheduleDate);
    if (parsed.scheduleTime) setters.setScheduleTime?.(parsed.scheduleTime);

    return hasMeaningfulContent;
  } catch {
    return false;
  }
}

export function serializeDraftToStorage(state) {
  const hasData = Boolean(
    state.title?.trim() ||
    state.body?.trim() ||
    state.targetScope === 'SELECT' ||
    state.scheduleType === 'SCHEDULED' ||
    (state.selectedCompanyIds && state.selectedCompanyIds.length > 0) ||
    (state.selectedStoreIds && state.selectedStoreIds.length > 0)
  );

  if (!hasData) return null;

  return JSON.stringify({
    title: state.title,
    body: state.body,
    kind: state.kind,
    duration: state.duration,
    customHours: state.customHours,
    targetScope: state.targetScope,
    targetType: state.targetType,
    selectedCompanyIds: state.selectedCompanyIds,
    selectedStoreIds: state.selectedStoreIds,
    selectedCompanies: state.selectedCompanies,
    selectedStores: state.selectedStores,
    scheduleType: state.scheduleType,
    scheduleDate: state.scheduleDate,
    scheduleTime: state.scheduleTime,
  });
}
