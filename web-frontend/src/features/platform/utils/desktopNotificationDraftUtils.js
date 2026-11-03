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

    // Targeting restoration
    if (parsed.targetScope === 'SELECT') {
      setters.setTargetScope?.('SELECT');
      const targetType = parsed.targetType === 'STORES' ? 'STORES' : 'COMPANIES';
      setters.setTargetType?.(targetType);
      setters.setSelectedCompanyIds?.(
        Array.isArray(parsed.selectedCompanyIds) ? parsed.selectedCompanyIds : []
      );
      setters.setSelectedStoreIds?.(
        Array.isArray(parsed.selectedStoreIds) ? parsed.selectedStoreIds : []
      );
      setters.setSelectedCompanies?.(
        Array.isArray(parsed.selectedCompanies) ? parsed.selectedCompanies : []
      );
      setters.setSelectedStores?.(
        Array.isArray(parsed.selectedStores) ? parsed.selectedStores : []
      );
    } else {
      setters.setTargetScope?.('ALL');
      setters.setTargetType?.('COMPANIES');
      setters.setSelectedCompanyIds?.([]);
      setters.setSelectedStoreIds?.([]);
      setters.setSelectedCompanies?.([]);
      setters.setSelectedStores?.([]);
    }

    // Scheduling restoration (defensive against past dates)
    if (parsed.scheduleType === 'SCHEDULED' && parsed.scheduleDate) {
      const parts = String(parsed.scheduleDate).split('-').map(Number);
      const timeParts = String(parsed.scheduleTime || '09:00').split(':').map(Number);
      const isDateValid = parts.length === 3 && !parts.some(isNaN);
      const scheduledDateObj = isDateValid
        ? new Date(parts[0], parts[1] - 1, parts[2], timeParts[0] || 0, timeParts[1] || 0, 0)
        : null;

      if (scheduledDateObj && scheduledDateObj.getTime() > Date.now()) {
        setters.setScheduleType?.('SCHEDULED');
        setters.setScheduleDate?.(parsed.scheduleDate);
        setters.setScheduleTime?.(parsed.scheduleTime || '09:00');
      } else {
        // Expired/past schedule resets safely to NOW
        setters.setScheduleType?.('NOW');
        setters.setScheduleDate?.('');
        setters.setScheduleTime?.('09:00');
      }
    } else {
      setters.setScheduleType?.('NOW');
      setters.setScheduleDate?.('');
      setters.setScheduleTime?.('09:00');
    }

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
    targetScope: state.targetScope === 'SELECT' ? 'SELECT' : 'ALL',
    targetType: state.targetType === 'STORES' ? 'STORES' : 'COMPANIES',
    selectedCompanyIds: Array.isArray(state.selectedCompanyIds) ? state.selectedCompanyIds : [],
    selectedStoreIds: Array.isArray(state.selectedStoreIds) ? state.selectedStoreIds : [],
    selectedCompanies: Array.isArray(state.selectedCompanies) ? state.selectedCompanies : [],
    selectedStores: Array.isArray(state.selectedStores) ? state.selectedStores : [],
    scheduleType: state.scheduleType === 'SCHEDULED' ? 'SCHEDULED' : 'NOW',
    scheduleDate: state.scheduleDate || '',
    scheduleTime: state.scheduleTime || '09:00',
  });
}
