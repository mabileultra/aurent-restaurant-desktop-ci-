import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useExecutiveSummary } from '../../src/hooks/useExecutiveSummary';
import { Screen } from '../../src/components/ui/Screen';
import { SalesHeroCard } from '../../src/components/today/SalesHeroCard';
import { KpiPairRow } from '../../src/components/today/KpiPairRow';
import { MiniTrendChart } from '../../src/components/today/MiniTrendChart';
import { ExpensesList } from '../../src/components/today/ExpensesList';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { formatUpdatedAt } from '../../src/utils/formatTime';

export default function TodayScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const query = useExecutiveSummary('TODAY');
  const data = query.data;

  const companyLabel = user?.companyLoginCode
    ? `«${user.companyLoginCode}»`
    : user?.fullName ?? '';

  return (
    <Screen
      refreshing={query.isFetching}
      onRefresh={() => void query.refetch()}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoSmall}>
            <Text style={styles.logoLetter}>A</Text>
          </View>
          <View>
            <Text style={styles.company}>{companyLabel}</Text>
            <Text style={styles.updated}>
              {t('today.updatedAt', { time: formatUpdatedAt(data?.updatedAt) })}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => void query.refetch()} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {query.isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : null}

      {query.isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{t('common.loadError')}</Text>
          <Pressable onPress={() => void query.refetch()}>
            <Text style={styles.retry}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : null}

      {data ? (
        <>
          <SalesHeroCard
            amount={Number(data.salesAmount)}
            salesCount={data.salesCount}
            salesPercent={Number(data.vsPrevious.salesPercent)}
          />
          <KpiPairRow
            profit={Number(data.netProfitToday)}
            profitPercent={Number(data.vsPrevious.profitPercent)}
            moneyTotal={Number(data.moneyTotal)}
          />
          <MiniTrendChart days={data.chart} />
          <ExpensesList
            total={Number(data.expensesTodayTotal)}
            items={data.topExpenses}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  logoSmall: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
  company: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  updated: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  loader: { marginTop: spacing.xxxl },
  errorBox: {
    backgroundColor: colors.expenseBg,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: { color: colors.expense, fontSize: 14 },
  retry: { color: colors.primary, fontWeight: '600' },
});
