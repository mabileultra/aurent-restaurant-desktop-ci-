import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { platformModuleAccessApi } from '../../../../../api';

/**
 * Xodimning individual huquqlarini yuklash, tekshirish va saqlash hooki (SRP)
 */
export function useRoleEmployeeEdit({ user, isOpen, onSaved, onClose }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [initialToggles, setInitialToggles] = useState({});
  const [moduleToggles, setModuleToggles] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    const userId = user.userId || user.id;

    setLoading(true);
    setSearchQuery('');
    setFilterMode('ALL');
    setConfirmDiscardOpen(false);
    setConfirmResetOpen(false);

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
        setInitialToggles(toggles);
        setModuleToggles(toggles);
      })
      .catch(() => toast.error('Xodim huquqlarini yuklab bo‘lmadi'))
      .finally(() => setLoading(false));
  }, [isOpen, user]);

  const handleToggle = (id) => setModuleToggles((prev) => ({ ...prev, [id]: !prev[id] }));

  const isDirty = useMemo(() => {
    const allKeys = new Set([...Object.keys(initialToggles), ...Object.keys(moduleToggles)]);
    for (const key of allKeys) {
      if (Boolean(moduleToggles[key]) !== Boolean(initialToggles[key])) return true;
    }
    return false;
  }, [initialToggles, moduleToggles]);

  const handleRequestClose = useCallback(() => {
    if (isDirty) {
      setConfirmDiscardOpen(true);
    } else {
      onClose?.();
    }
  }, [isDirty, onClose]);

  const handleConfirmDiscard = () => {
    setConfirmDiscardOpen(false);
    onClose?.();
  };

  const handleSave = async () => {
    if (!user || saving) return;
    const hasAtLeastOne = Object.values(moduleToggles).some(Boolean);
    if (!hasAtLeastOne) {
      toast.error('Kamida bitta modul yoqilgan bo‘lishi shart');
      return;
    }

    if (!isDirty && detail?.moduleAccessCustom) {
      toast.success(`${user.fullName || user.username} huquqlari o‘zgarmadi`);
      onClose?.();
      return;
    }

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

  const handleConfirmReset = async () => {
    if (!user || saving) return;
    const userId = user.userId || user.id;
    try {
      setSaving(true);
      await platformModuleAccessApi.resetUser(userId);
      toast.success('Xodim rol shabloniga qaytarildi');
      setConfirmResetOpen(false);
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
    isDirty,
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    confirmDiscardOpen,
    setConfirmDiscardOpen,
    confirmResetOpen,
    setConfirmResetOpen,
    handleToggle,
    handleRequestClose,
    handleConfirmDiscard,
    handleSave,
    handleConfirmReset,
    defaultsMap,
  };
}
