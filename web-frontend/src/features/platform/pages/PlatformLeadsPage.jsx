import React from 'react';
import { PageLayout } from '../../../components/ui';
import PlatformLeadsHeaderAlert from '../components/leads/PlatformLeadsHeaderAlert';
import PlatformLeadsFilterToolbar from '../components/leads/PlatformLeadsFilterToolbar';
import PlatformLeadsSidebarList from '../components/leads/PlatformLeadsSidebarList';
import PlatformLeadDetailPane from '../components/leads/PlatformLeadDetailPane';
import PlatformLeadConvertToCompanyView from '../components/leads/PlatformLeadConvertToCompanyView';
import PlatformLeadMobileDetailView from '../components/leads/PlatformLeadMobileDetailView';
import { usePlatformLeadsPage } from '../hooks/usePlatformLeadsPage';

export default function PlatformLeadsPage() {
  const p = usePlatformLeadsPage();

  if (p.viewMode === 'convert_company' && p.convertTargetLead) {
    return (
      <PageLayout spacing="space-y-4">
        <PlatformLeadConvertToCompanyView
          lead={p.convertTargetLead}
          onBack={() => p.setViewMode('split')}
          onSubmit={p.handleConvertSubmit}
          isSubmitting={p.isSaving}
          t={p.t}
        />
      </PageLayout>
    );
  }

  if (p.viewMode === 'mobile_detail' && p.selectedLead) {
    return (
      <PageLayout spacing="space-y-4">
        <PlatformLeadMobileDetailView
          lead={p.selectedLead}
          onBack={() => p.setViewMode('split')}
          onStatusChange={p.handleStatusChange}
          onAddComment={p.handleAddComment}
          onConvertToCompany={p.handleStartConvert}
          isSaving={p.isSaving}
          t={p.t}
        />
      </PageLayout>
    );
  }

  const handleSelectLead = (lead) => {
    p.setSelectedLeadId(lead.id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      p.handleSelectLeadMobile(lead);
    }
  };

  return (
    <PageLayout
      spacing="space-y-4"
      title={p.t('platform.leads.title')}
      subtitle={p.t('platform.leads.subtitle')}
    >
      {/* 1. Unanswered SLA Banner */}
      <PlatformLeadsHeaderAlert unansweredCount={p.unansweredCount} t={p.t} />

      {/* 2. Filters & Search Toolbar */}
      <PlatformLeadsFilterToolbar
        t={p.t}
        status={p.status}
        onStatusChange={p.setStatus}
        counts={p.counts}
        search={p.search}
        onSearchChange={p.setSearch}
        leadType={p.leadType}
        onTypeChange={p.setLeadType}
      />

      {/* 3. Master-Detail 2-Column Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
        {/* Left Column: Leads List */}
        <div className="lg:col-span-5 xl:col-span-5">
          <PlatformLeadsSidebarList
            leads={p.rows}
            selectedId={p.selectedLead?.id}
            onSelectLead={handleSelectLead}
            t={p.t}
            isPending={p.isPending}
          />
        </div>

        {/* Right Column: Lead Detail (Desktop) */}
        <div className="hidden lg:block lg:col-span-7 xl:col-span-7 sticky top-4">
          <PlatformLeadDetailPane
            lead={p.selectedLead}
            hasLeads={p.rows.length > 0}
            t={p.t}
            onStatusChange={p.handleStatusChange}
            onAddComment={p.handleAddComment}
            onConvertToCompany={p.handleStartConvert}
            onDeleteLead={p.handleDeleteLead}
            isSaving={p.isSaving}
            isDeleting={p.isDeleting}
          />
        </div>
      </div>
    </PageLayout>
  );
}
