import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { platformModuleAccessApi } from '../../../../../api';

/**
 * Xodimning individual huquqlarini yuklash va saqlash hooki (SRP)
 */
export function useRoleEmployeeEdit({ user, isOpen, onSaved, onClose }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [moduleToggles, setModuleToggles] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');

  useEffect(() => {
    if (!isOpen || !user) return;
    const userId = user.userId || user.id;

    setLoading(true);
    setSearchQuery('');
    setFilterMode('ALL');

    platformModuleAccessApi
      .getUser(userId)
      .then((res) => {
        const d = res.data;
        setDetail(d);
        const toggles = {};
        if (Array.isArray(d?.modules)) {
          d.modules.forEach((m) => {
            toggles[m.id] = Boolean(m.allowed);
          });
        }
        setModuleToggles(toggles);
      })
      .catch(() => toast.error('Xodim huquqlarini yuklab bo‘lmadi'))
      .finally(() => setLoading(false));
  }, [isOpen, user]);

  const handleToggle = (id) => setModuleToggles((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSave = async () => {
    if (!user || saving) return;
    const userId = user.userId || user.id;
    try {
      setSaving(true);
      await platformModuleAccessApi.updateUser(userId, { customAccess: true, modules: moduleToggles });
      toast.success(`${user.fullName || user.username} huquqlari saqlandi`);
      onSaved?.();
      onClose?.();
    } catch {
      toast.error('Huquqlarni saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user || saving) return;
    const userId = user.userId || user.id;
    try {
      setSaving(true);
      await platformModuleAccessApi.resetUser(userId);
      toast.success('Xodim rol shabloniga qaytarildi');
      onSaved?.();
      onClose?.();
    } catch {
      toast.error('Shablonga qaytarishda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const defaultsMap = useMemo(() => {
    const map = new Map();
    detail?.modules?.forEach((m) => map.set(m.id, Boolean(m.roleDefault)));
    return map;
  }, [detail]);

  return {
    loading,
    saving,
    detail,
    moduleToggles,
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    handleToggle,
    handleSave,
    handleReset,
    defaultsMap,
  };
}
