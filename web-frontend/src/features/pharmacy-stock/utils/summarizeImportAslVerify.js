/**
 * Точный итог полной ASL-проверки импорта: сколько приняты / по причинам отказа.
 */
export function summarizeImportAslVerify(accepted, rejected) {
  const acceptedCount = Object.values(accepted || {}).reduce(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0,
  );

  const byReason = {
    notFound: 0,
    alreadySold: 0,
    noIntegration: 0,
    error: 0,
  };

  const rejectedList = Array.isArray(rejected) ? rejected : [];
  for (const item of rejectedList) {
    const reason = item?.reason;
    if (reason === 'notFound' || reason === 'alreadySold' || reason === 'noIntegration' || reason === 'error') {
      byReason[reason] += 1;
    } else {
      byReason.error += 1;
    }
  }

  return {
    acceptedCount,
    rejectedCount: rejectedList.length,
    notFoundCount: byReason.notFound,
    alreadySoldCount: byReason.alreadySold,
    noIntegrationCount: byReason.noIntegration,
    errorCount: byReason.error,
    rejected: rejectedList,
  };
}
