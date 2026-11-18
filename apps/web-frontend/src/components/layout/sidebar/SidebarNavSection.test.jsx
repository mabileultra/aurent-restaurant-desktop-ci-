// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SidebarNavSection from './SidebarNavSection';

afterEach(cleanup);

describe('SidebarNavSection', () => {
  const mockT = (key) => key;
  const mockIcon = () => <span data-testid="mock-icon">Icon</span>;
  const mockItems = [{ to: '/test', label: 'Test Item', icon: mockIcon }];

  it('renders nothing when show is false', () => {
    const { container } = render(
      <SidebarNavSection
        show={false}
        navLabelsVisible={true}
        label="Group 1"
        icon={mockIcon}
        isOpen={false}
        onToggle={vi.fn()}
        isActive={false}
        items={mockItems}
        subLinkClass={vi.fn()}
        t={mockT}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders expanded group when navLabelsVisible is true', () => {
    render(
      <MemoryRouter>
        <SidebarNavSection
          show={true}
          navLabelsVisible={true}
          label="Goods Group"
          icon={mockIcon}
          isOpen={true}
          onToggle={vi.fn()}
          isActive={false}
          items={mockItems}
          subLinkClass={() => 'sublink'}
          t={mockT}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Goods Group')).toBeDefined();
  });

  it('renders compact group when navLabelsVisible is false', () => {
    render(
      <MemoryRouter>
        <SidebarNavSection
          show={true}
          navLabelsVisible={false}
          label="Goods Group"
          icon={mockIcon}
          isOpen={false}
          onToggle={vi.fn()}
          isActive={false}
          items={mockItems}
          subLinkClass={() => 'sublink'}
          t={mockT}
        />
      </MemoryRouter>
    );
    // In compact mode, group title isn't shown directly as button text, compact items render
    expect(screen.queryByText('Goods Group')).toBeNull();
  });
});
