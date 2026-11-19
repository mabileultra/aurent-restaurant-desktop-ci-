import React from 'react';

export default function StoresGroupedSkeleton() {
  return (
    <div className="space-y-3">
      <div className="ui-card flex items-center justify-between px-4 py-3 animate-pulse">
        <div className="h-4 w-48 rounded bg-canvas" />
        <div className="h-6 w-24 rounded-lg bg-canvas" />
      </div>
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={`grouped-skeleton-${idx}`}
          className="ui-card-padded animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-control bg-canvas" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-canvas" />
                <div className="h-3 w-24 rounded bg-canvas" />
              </div>
            </div>
            <div className="h-6 w-16 rounded-full bg-canvas" />
          </div>
        </div>
      ))}
    </div>
  );
}
