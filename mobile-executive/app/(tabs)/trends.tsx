import { useState } from 'react';
import { Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { fetchExecutiveSummary } from '../../src/api/executive.api';
import type { ExecutivePeriod } from '../../src/api/types';
import { Screen } from '../../src/components/ui/Screen';
import { TrendsPeriodSwitcher } from '../../src/components/trends/TrendsPeriodSwitcher';
import { IncomeExpenseLineChart } from '../../src/components/trends/IncomeExpenseLineChart';
import { ProfitByDayChart } from '../../src/components/trends/ProfitByDayChart';
import { PeriodCompareCard } from '../../src/components/trends/PeriodCompareCard';
import { TrendStatsRow } from '../../src/components/trends/TrendStatsRow';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function TrendsScreen() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<ExecutivePeriod>('WEEK');
  const query = useQuery({
    queryKey: ['executive-summary', period],
    queryFn: () => fetchExecutiveSummary(period),
    staleTime: 60_000,
  });
  const data = query.data;

  const periodLabels: Record<ExecutivePeriod, string> = {
    TODAY: t('trends.periodToday'),
    WEEK: t('trends.periodWeek'),
    MONTH: t('trends.periodMonth'),
  };

  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>{t('trends.title')}</Text>
      <Text style={styles.subtitle}>{t('trends.subtitle')}</Text>

      <TrendsPeriodSwitcher
        value={period}
        onChange={setPeriod}
        labels={periodLabels}
      />

      {query.isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {data ? (
        <>
          <IncomeExpenseLineChart days={data.chart} period={period} />
          <ProfitByDayChart days={data.chart} />
          <PeriodCompareCard
            period={period}
            netProfit={Number(data.netProfitPeriod)}
            previousNetProfit={Number(data.previousPeriod?.netProfit ?? 0)}
            profitPercent={Number(data.vsPrevious.profitPercent)}
          />
          <TrendStatsRow
            averageCheck={Number(data.averageCheck ?? 0)}
            salesCount={Number(data.periodSalesCount ?? data.salesCount)}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: -spacing.sm,
    marginBottom: spacing.xs,
  },
  loader: {
    marginTop: spacing.xl,
  },
});
