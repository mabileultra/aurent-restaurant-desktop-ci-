import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { formatMoney } from '../../utils/formatMoney';
import { formatPercent } from '../../utils/formatPercent';
import type { ExecutivePeriod } from '../../api/types';

interface PeriodCompareCardProps {
  period: ExecutivePeriod;
  netProfit: number;
  previousNetProfit: number;
  profitPercent: number;
}

export function PeriodCompareCard({
  period,
  netProfit,
  previousNetProfit,
  profitPercent,
}: PeriodCompareCardProps) {
  const { t } = useTranslation();
  const positive = profitPercent >= 0;

  const periodTitle = period === 'TODAY'
    ? t('trends.compareToday')
    : period === 'WEEK'
      ? t('trends.compareWeek')
      : t('trends.compareMonth');

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>{periodTitle}</Text>
        <View style={[styles.badge, positive ? styles.badgeUp : styles.badgeDown]}>
          <Ionicons
            name={positive ? 'trending-up' : 'trending-down'}
            size={14}
            color={positive ? colors.income : colors.expense}
          />
          <Text style={[styles.badgeText, positive ? styles.up : styles.down]}>
            {formatPercent(profitPercent)}
          </Text>
        </View>
      </View>

      <Text style={styles.label}>{t('trends.netProfitPeriod')}</Text>
      <Text style={styles.value}>{formatMoney(netProfit, t)}</Text>

      <View style={styles.divider} />

      <Text style={styles.prevLabel}>{t('trends.previousPeriod')}</Text>
      <Text style={styles.prevValue}>{formatMoney(previousNetProfit, t)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    flex: 1,
    paddingRight: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeUp: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  badgeDown: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  up: {
    color: '#BBF7D0',
  },
  down: {
    color: '#FECACA',
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  value: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: spacing.lg,
  },
  prevLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  prevValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
