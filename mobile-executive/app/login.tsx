import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/hooks/useAuth';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { setRememberDevice, getRememberDevice, setSavedServerUrl, getSavedServerUrl } from '../src/storage/session';
import { setAppLanguage, getAppLanguage } from '../src/i18n';
import { API_BASE_URL } from '../src/config/api';
import { DEFAULT_API_URL, setApiBaseUrl } from '../src/config/serverUrl';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [companyCode, setCompanyCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState(DEFAULT_API_URL);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showServer, setShowServer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'ru' | 'uz'>(getAppLanguage());

  useEffect(() => {
    void (async () => {
      const saved = await getSavedServerUrl();
      const url = saved?.trim() || API_BASE_URL() || DEFAULT_API_URL;
      setServerUrl(url);
      setApiBaseUrl(url);
      setRemember(await getRememberDevice());
    })();
  }, []);

  const toggleLang = (next: 'ru' | 'uz') => {
    setLang(next);
    setAppLanguage(next);
  };

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (serverUrl.trim()) {
        await setSavedServerUrl(serverUrl.trim());
        setApiBaseUrl(serverUrl.trim());
      }
      await setRememberDevice(remember);
      await login({
        companyLoginCode: companyCode || undefined,
        username,
        password,
      });
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError(t('login.badCredentials'));
      } else if (!(e as { response?: unknown })?.response) {
        setError(t('login.networkError'));
      } else {
        setError(t('login.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={styles.logo}>
              <Ionicons name="business" size={28} color={colors.white} />
            </View>
            <Text style={styles.brand}>{t('login.title')}</Text>
            <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
          </View>

          <View style={styles.card}>
            <Field label={t('login.companyCode')}>
              <TextInput
                style={styles.input}
                value={companyCode}
                onChangeText={setCompanyCode}
                placeholder={t('login.companyCodePh')}
                placeholderTextColor={colors.textLight}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </Field>

            <Field label={t('login.username')}>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder={t('login.usernamePh')}
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>

            <Field label={t('login.password')}>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            </Field>

            <Pressable style={styles.rememberRow} onPress={() => setRemember((v) => !v)}>
              <Ionicons
                name={remember ? 'checkbox' : 'square-outline'}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.rememberText}>{t('login.remember')}</Text>
            </Pressable>

            <Pressable
              style={styles.serverToggle}
              onPress={() => setShowServer((v) => !v)}
            >
              <Text style={styles.serverToggleText}>{t('login.serverUrl')}</Text>
              <Ionicons
                name={showServer ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.primary}
              />
            </Pressable>

            {showServer ? (
              <Field label={t('login.serverUrl')}>
                <TextInput
                  style={styles.input}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  placeholder={t('login.serverUrlPh')}
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.hint}>{t('login.serverUrlHint')}</Text>
              </Field>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={() => void onSubmit()}
              disabled={loading || !username || !password}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>{t('login.signIn')} →</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.langRow}>
            <Pressable
              style={[styles.langBtn, lang === 'ru' && styles.langBtnActive]}
              onPress={() => toggleLang('ru')}
            >
              <Text style={[styles.langText, lang === 'ru' && styles.langTextActive]}>
                {t('profile.langRu')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.langBtn, lang === 'uz' && styles.langBtnActive]}
              onPress={() => toggleLang('uz')}
            >
              <Text style={[styles.langText, lang === 'uz' && styles.langTextActive]}>
                {t('profile.langUz')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  field: { marginBottom: spacing.lg },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 44 },
  eyeBtn: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  rememberText: { fontSize: 14, color: colors.textMuted },
  serverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  serverToggleText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  hint: { fontSize: 12, color: colors.textLight, marginTop: spacing.xs },
  error: { color: colors.expense, fontSize: 13, marginBottom: spacing.md },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  langBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  langBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  langText: { fontSize: 14, color: colors.textMuted },
  langTextActive: { color: colors.primary, fontWeight: '600' },
});
