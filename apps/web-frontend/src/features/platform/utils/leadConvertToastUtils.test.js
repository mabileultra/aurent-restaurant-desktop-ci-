import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { notifyConvertResult } from './leadConvertToastUtils';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('leadConvertToastUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('notifies error when storeError and businessTypeError both present', () => {
    notifyConvertResult({ storeError: 'Limit', businessTypeError: 'Not found' });
    expect(toast.error).toHaveBeenCalledWith('Kompaniya yaratildi, ammo xatoliklar yuz berdi: filial (Limit); faoliyat turi (Not found)');
  });

  it('notifies error when storeError present', () => {
    notifyConvertResult({ storeError: 'Region required' });
    expect(toast.error).toHaveBeenCalledWith('Kompaniya yaratildi, ammo xatoliklar yuz berdi: filial (Region required)');
  });

  it('notifies error when userError present', () => {
    notifyConvertResult({ userError: 'Email invalid' });
    expect(toast.error).toHaveBeenCalledWith('Kompaniya yaratildi, ammo xatoliklar yuz berdi: admin (Email invalid)');
  });

  it('notifies error when businessTypeError present', () => {
    notifyConvertResult({ businessTypeError: 'Invalid type' });
    expect(toast.error).toHaveBeenCalledWith('Kompaniya yaratildi, ammo xatoliklar yuz berdi: faoliyat turi (Invalid type)');
  });

  it('notifies success with admin and store', () => {
    notifyConvertResult({ adminCreated: true, storeId: 10 });
    expect(toast.success).toHaveBeenCalledWith('Kompaniya, filial va admin muvaffaqiyatli yaratildi');
  });

  it('notifies success with store only when admin creation was unticked', () => {
    notifyConvertResult({ adminCreated: false, storeId: 10 });
    expect(toast.success).toHaveBeenCalledWith('Kompaniya va filial muvaffaqiyatli yaratildi');
  });

  it('notifies success with company only when neither admin nor store created', () => {
    notifyConvertResult({ adminCreated: false, storeId: null });
    expect(toast.success).toHaveBeenCalledWith('Kompaniya muvaffaqiyatli yaratildi');
  });
});
