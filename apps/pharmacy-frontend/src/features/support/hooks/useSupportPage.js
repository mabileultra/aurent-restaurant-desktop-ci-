import { useEffect, useState } from 'react';
import { supportApi } from '../../../api/support.api';
import {
  isSupportConfigured,
  supportPhone as envPhone,
  supportPhoneHref as envPhoneHref,
  supportTelegramBot as envBot,
  supportTelegramUrl as envTelegramUrl,
} from '../../../config/support';

function normalizeBot(raw) {
  const value = (raw ?? '').trim().replace(/^@/, '');
  return value || null;
}

function phoneHrefFrom(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}

/**
 * Контакты поддержки: сначала с backend (SUPPORT_TELEGRAM_BOT),
 * иначе fallback на VITE_* при сборке.
 * Аптечный бот сюда никогда не подставляется из кода.
 */
export function useSupportPage() {
  const [phone, setPhone] = useState(envPhone);
  const [telegramBot, setTelegramBot] = useState(envBot);
  const [telegramUrl, setTelegramUrl] = useState(envTelegramUrl());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supportApi
      .getContacts()
      .then((data) => {
        if (cancelled || !data) return;
        const bot = normalizeBot(data.telegramBot);
        const nextPhone = (data.phone ?? '').trim() || envPhone;
        const nextBot = bot || envBot;
        const nextUrl = (data.telegramUrl ?? '').trim()
          || (nextBot ? `https://t.me/${nextBot}` : envTelegramUrl());
        setPhone(nextPhone);
        setTelegramBot(nextBot);
        setTelegramUrl(nextUrl);
      })
      .catch(() => {
        /* оставляем VITE fallback */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const configured = Boolean(phone || telegramBot) || isSupportConfigured();

  return {
    loading,
    configured,
    supportPhone: phone,
    phoneHref: phoneHrefFrom(phone) || envPhoneHref(),
    supportTelegramBot: telegramBot,
    telegramUrl,
    hasPhone: Boolean(phone),
    hasTelegram: Boolean(telegramBot && telegramUrl),
  };
}
