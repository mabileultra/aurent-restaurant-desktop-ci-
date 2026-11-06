import React from 'react';
import PlatformEmailHistoryDetail from './PlatformEmailHistoryDetail';
import PlatformEmailHistoryKPIs from './PlatformEmailHistoryKPIs';
import PlatformEmailHistoryTable from './PlatformEmailHistoryTable';

export default function PlatformEmailHistoryTab({ flow, onGoToSend }) {
  const handleCopyDraft = () => {
    onGoToSend?.();
  };

  return (
    <div className="flex flex-col gap-4">
      <PlatformEmailHistoryKPIs stats={flow.stats} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr] items-start">
        <PlatformEmailHistoryTable flow={flow} />
        <PlatformEmailHistoryDetail
          selectedRow={flow.selectedRow}
          onRetryFails={flow.handleRetryFails}
          onCopyDraft={handleCopyDraft}
        />
      </div>
    </div>
  );
}
