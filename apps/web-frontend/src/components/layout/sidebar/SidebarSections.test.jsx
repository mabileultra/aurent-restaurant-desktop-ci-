// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SidebarTopLinks from './SidebarTopLinks';
import SidebarReportsSection from './SidebarReportsSection';

afterEach(cleanup);

describe('Sidebar subcomponents', () => {
  const mockT = (key) => key;

  describe('SidebarTopLinks', () => {
    it('renders dashboard, handbook, and support links', () => {
      render(
        <MemoryRouter>
          <SidebarTopLinks
            showDashboard={true}
            showAssistant={false}
            navLabelsVisible={true}
            topLinkClass={() => 'toplink'}
            t={mockT}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('nav.dashboard')).toBeDefined();
      expect(screen.getByText('nav.handbook')).toBeDefined();
      expect(screen.getByText('nav.support')).toBeDefined();
    });
  });

  describe('SidebarReportsSection', () => {
    it('returns null if showReports is false', () => {
      const { container } = render(
        <SidebarReportsSection
          showReports={false}
          navLabelsVisible={true}
          t={mockT}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders expanded reports when visible', () => {
      render(
        <MemoryRouter>
          <SidebarReportsSection
            showReports={true}
            navLabelsVisible={true}
            reportsOpen={true}
            setReportsOpen={vi.fn()}
            inReportsSection={false}
            reportsHubActive={false}
            reportsSalesOpen={false}
            setReportsSalesOpen={vi.fn()}
            inReportsSalesSection={false}
            showReportsSales={true}
            reportsSalesNav={[]}
            reportsStockOpen={false}
            setReportsStockOpen={vi.fn()}
            inReportsStockSection={false}
            showReportsStock={true}
            reportsStockNav={[]}
            subLinkClass={() => 'sublink'}
            t={mockT}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('nav.reportsGroup')).toBeDefined();
    });
  });
});
