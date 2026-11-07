import { useState } from 'react';
import toast from 'react-hot-toast';

const INITIAL_SETTINGS = {
  sender: {
    name: 'Aurent POS',
    email: 'noreply@aurent.uz',
    replyTo: 'support@aurent.uz',
    lang: 'recipient',
  },
  smtp: {
    server: 'smtp.aurent.uz',
    port: '587',
    login: 'noreply@aurent.uz',
    pass: '••••••••••••',
    encryption: 'STARTTLS',
    status: 'Faol',
  },
  watchEmails: [
    { email: 'xavfsizlik@aurent.uz', verified: true },
    { email: 'direktor@aurent.uz', verified: true },
    { email: 'it@aurent.uz', verified: false },
  ],
  triggers: {
    everyLogin: true,
    newDevice: true,
    failedAttempts: false,
  },
};

export function useEmailSettingsFlow() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [newEmail, setNewEmail] = useState('');
  const [dirty, setDirty] = useState(false);

  const updateSender = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      sender: { ...prev.sender, [field]: value },
    }));
    setDirty(true);
  };

  const updateSmtp = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      smtp: { ...prev.smtp, [field]: value },
    }));
    setDirty(true);
  };

  const toggleTrigger = (key) => {
    setSettings((prev) => ({
      ...prev,
      triggers: { ...prev.triggers, [key]: !prev.triggers[key] },
    }));
    setDirty(true);
  };

  const addWatchEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      toast.error('To‘g‘ri email manzil kiriting');
      return;
    }
    if (settings.watchEmails.some((item) => item.email === trimmed)) {
      toast.error('Bu manzil allaqachon ro‘yxatda mavjud');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      watchEmails: [...prev.watchEmails, { email: trimmed, verified: false }],
    }));
    setNewEmail('');
    setDirty(true);
    toast.success('Yangi manzil qo‘shildi');
  };

  const removeWatchEmail = (email) => {
    setSettings((prev) => ({
      ...prev,
      watchEmails: prev.watchEmails.filter((item) => item.email !== email),
    }));
    setDirty(true);
  };

  const handleTestConnection = () => {
    toast.error('Ulanishni tekshirish tez kunda ishga tushadi');
  };

  const handleSave = () => {
    toast.error('Sozlamalarni saqlash tez kunda ishga tushadi');
  };

  const handleCancel = () => {
    setSettings(INITIAL_SETTINGS);
    setDirty(false);
    toast('O‘zgarishlar bekor qilindi');
  };

  return {
    settings,
    updateSender,
    updateSmtp,
    toggleTrigger,
    watchEmails: settings.watchEmails,
    newEmail,
    setNewEmail,
    addWatchEmail,
    removeWatchEmail,
    dirty,
    handleTestConnection,
    handleSave,
    handleCancel,
  };
}
