import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { useAuth } from '../../src/hooks/useAuth';
import { Screen } from '../../src/components/ui/Screen';
import { Card } from '../../src/components/ui/Card';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { setAppLanguage, getAppLanguage } from '../../src/i18n';
import { getApiBaseUrl } from '../../src/config/serverUrl';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const lang = getAppLanguage();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const onLogout = () => {
    Alert.alert(t('profile.logoutConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.logout'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await logout();
            router.replace('/login');
          })();
        },
      },
    ]);
  };

  const switchLang = (next: 'ru' | 'uz') => {
    setAppLanguage(next);
    void i18n.changeLanguage(next);
  };

  return (
    <Screen padded>
      <Text style={styles.title}>{t('profile.title')}</Text>

      <Card>
        <Row label={t('profile.company')} value={user?.companyLoginCode ?? '—'} />
        <Row label={t('login.username')} value={user?.fullName ?? user?.username ?? '—'} />
        <Row
          label={t('profile.role')}
          value={t(`roles.${user?.role ?? 'ADMIN'}` as 'roles.ADMIN')}
        />
        <Row label={t('profile.server')} value={getApiBaseUrl()} />
      </Card>

      <Card>
        <Text style={styles.section}>{t('profile.language')}</Text>
        <View style={styles.langRow}>
          <Pressable
            style={[styles.langBtn, lang === 'ru' && styles.langBtnActive]}
            onPress={() => switchLang('ru')}
          >
            <Text style={[styles.langText, lang === 'ru' && styles.langTextActive]}>
              {t('profile.langRu')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.langBtn, lang === 'uz' && styles.langBtnActive]}
            onPress={() => switchLang('uz')}
          >
            <Text style={[styles.langText, lang === 'uz' && styles.langTextActive]}>
              {t('profile.langUz')}
            </Text>
          </Pressable>
        </View>
      </Card>

      <Pressable style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>{t('common.logout')}</Text>
      </Pressable>

      <Text style={styles.version}>{t('common.version', { version })}</Text>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  section: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  langRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  langBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  langBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  langText: { fontSize: 14, color: colors.textMuted },
  langTextActive: { color: colors.primary, fontWeight: '600' },
  logoutBtn: {
    backgroundColor: colors.expenseBg,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.expense,
    fontWeight: '700',
    fontSize: 15,
  },
  version: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 12,
    marginTop: spacing.lg,
  },
});
