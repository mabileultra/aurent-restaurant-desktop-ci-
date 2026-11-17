import React from 'react';
import { REPORT_HUB } from '../layoutNavConfig';
import SidebarGroupCompact from './SidebarGroupCompact';
import SidebarReportsExpanded from './SidebarReportsExpanded';

export default function SidebarReportsSection({
  showReports,
  navLabelsVisible,
  reportsOpen,
  setReportsOpen,
  inReportsSection,
  reportsHubActive,
  reportsSalesOpen,
  setReportsSalesOpen,
  inReportsSalesSection,
  showReportsSales,
  reportsSalesNav,
  reportsStockOpen,
  setReportsStockOpen,
  inReportsStockSection,
  showReportsStock,
  reportsStockNav,
  subLinkClass,
  t,
}) {
  if (!showReports) return null;

  if (navLabelsVisible) {
    return (
      <SidebarReportsExpanded
        t={t}
        reportsOpen={reportsOpen}
        onReportsToggle={() => setReportsOpen((o) => !o)}
        inReportsSection={inReportsSection}
        reportsHubActive={reportsHubActive}
        reportsSalesOpen={reportsSalesOpen}
        onReportsSalesToggle={() => setReportsSalesOpen((o) => !o)}
        inReportsSalesSection={inReportsSalesSection}
        showReportsSales={showReportsSales}
        reportsSalesNav={reportsSalesNav}
        reportsStockOpen={reportsStockOpen}
        onReportsStockToggle={() => setReportsStockOpen((o) => !o)}
        inReportsStockSection={inReportsStockSection}
        showReportsStock={showReportsStock}
        reportsStockNav={reportsStockNav}
        subLinkClass={subLinkClass}
      />
    );
  }

  return (
    <SidebarGroupCompact
      t={t}
      items={[REPORT_HUB, ...reportsSalesNav, ...reportsStockNav]}
    />
  );
}
