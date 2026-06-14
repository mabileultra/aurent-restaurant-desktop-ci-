import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { DeltaBadge } from '../ui/DeltaBadge';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { formatMoney, formatMoneyCompact } from '../../utils/formatMoney';

interface KpiPairRowProps {
  profit: number;
  profitPercent: number;
  moneyTotal: number;
}

export function KpiPairRow({ profit, profitPercent, moneyTotal }: KpiPairRowProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <Card style={styles.half}>
        <Text style={styles.label}>{t('today.profit')}</Text>
        <Text style={styles.value}>{formatMoney(profit, t)}</Text>
        <DeltaBadge value={profitPercent} invert />
      </Card>
      <Card style={styles.half}>
        <Text style={styles.label}>{t('today.money')}</Text>
        <Text style={styles.value}>{formatMoneyCompact(moneyTotal, t)}</Text>
        <Text style={styles.hint}>{t('today.cashAndBank')}</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
  },
});
