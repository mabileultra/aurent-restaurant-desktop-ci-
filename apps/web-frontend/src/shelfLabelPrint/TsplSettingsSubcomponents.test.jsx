// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import TsplCandidatesList from './TsplCandidatesList';
import TsplPortGapInputs from './TsplPortGapInputs';

afterEach(cleanup);

describe('TsplSettingsSubcomponents', () => {
  const mockT = (key, opt) => opt?.defaultValue || key;

  describe('TsplCandidatesList', () => {
    it('returns null when candidates list is empty', () => {
      const { container } = render(
        <TsplCandidatesList candidates={[]} selectedHost="" t={mockT} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders candidates and calls onPick when clicked', () => {
      const candidates = [
        { host: '192.168.1.150', port: 9100, source: 'network_scan' },
        { host: '192.168.1.151', port: 9100, source: 'windows_printer' },
      ];
      const onPick = vi.fn();

      render(
        <TsplCandidatesList
          candidates={candidates}
          selectedHost="192.168.1.150"
          onPick={onPick}
          t={mockT}
        />
      );

      expect(screen.getByText('192.168.1.150')).toBeDefined();
      expect(screen.getByText('192.168.1.151')).toBeDefined();

      fireEvent.click(screen.getByText('192.168.1.151'));
      expect(onPick).toHaveBeenCalledWith('192.168.1.151');
    });
  });

  describe('TsplPortGapInputs', () => {
    it('renders port and gap inputs and triggers blur/change', () => {
      const settings = { port: 9100, gapMm: 2 };
      const onChange = vi.fn();
      const onPersist = vi.fn();

      render(
        <TsplPortGapInputs
          settings={settings}
          onChange={onChange}
          onPersist={onPersist}
          t={mockT}
        />
      );

      const portInput = screen.getByDisplayValue('9100');
      const gapInput = screen.getByDisplayValue('2');
      expect(portInput).toBeDefined();
      expect(gapInput).toBeDefined();

      fireEvent.blur(portInput);
      expect(onPersist).toHaveBeenCalledWith({ port: 9100 });
    });
  });
});
