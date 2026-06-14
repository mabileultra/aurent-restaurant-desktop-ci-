import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { formatMoney, formatMoneyCompact } from '../../utils/formatMoney';

interface MoneySummaryCardsProps {
  cashTotal: number;
  bankTotal: number;
  moneyTotal: number;
  customerDebtTotal: number;
  supplierDebtTotal: number;
}

export function MoneySummaryCards({
  cashTotal,
  bankTotal,
  moneyTotal,
  customerDebtTotal,
  supplierDebtTotal,
}: MoneySummaryCardsProps) {
  const { t } = useTranslation();
  const freeMoney = moneyTotal - supplierDebtTotal;

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.section}>{t('money.total')}</Text>
        <Text style={styles.hero}>{formatMoneyCompact(moneyTotal, t)}</Text>
        <View style={styles.split}>
          <View style={styles.splitItem}>
            <Text style={styles.label}>{t('money.cash')}</Text>
            <Text style={styles.value}>{formatMoney(cashTotal, t)}</Text>
          </View>
          <View style={styles.splitItem}>
            <Text style={styles.label}>{t('money.bank')}</Text>
            <Text style={styles.value}>{formatMoney(bankTotal, t)}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.debtRow}>
          <Text style={styles.label}>{t('money.customerDebt')}</Text>
          <Text style={[styles.value, styles.income]}>{formatMoney(customerDebtTotal, t)}</Text>
        </View>
        <View style={styles.debtRow}>
          <Text style={styles.label}>{t('money.supplierDebt')}</Text>
          <Text style={[styles.value, styles.expense]}>{formatMoney(supplierDebtTotal, t)}</Text>
        </View>
        <View style={[styles.debtRow, styles.freeRow]}>
          <Text style={styles.freeLabel}>{t('money.freeMoney')}</Text>
          <Text style={styles.freeValue}>{formatMoney(freeMoney, t)}</Text>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  section: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  hero: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  split: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  splitItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
  },
  debtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  income: {
    color: colors.income,
  },
  expense: {
    color: colors.expense,
  },
  freeRow: {
    borderBottomWidth: 0,
    marginTop: spacing.sm,
    paddingTop: spacing.lg,
  },
  freeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  freeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
});
