import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { formatMoney } from '../../utils/formatMoney';

interface TrendStatsRowProps {
  averageCheck: number;
  salesCount: number;
}

export function TrendStatsRow({ averageCheck, salesCount }: TrendStatsRowProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <Card style={styles.tile}>
        <View style={[styles.icon, styles.iconGreen]}>
          <Ionicons name="receipt-outline" size={20} color={colors.income} />
        </View>
        <Text style={styles.label}>{t('trends.averageCheck')}</Text>
        <Text style={styles.value}>{formatMoney(averageCheck, t)}</Text>
      </Card>

      <Card style={styles.tile}>
        <View style={[styles.icon, styles.iconBlue]}>
          <Ionicons name="cart-outline" size={20} color={colors.primary} />
        </View>
        <Text style={styles.label}>{t('trends.salesCount')}</Text>
        <Text style={styles.value}>{t('today.receipts', { count: salesCount })}</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    minHeight: 120,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconGreen: {
    backgroundColor: colors.incomeBg,
  },
  iconBlue: {
    backgroundColor: colors.primaryLight,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
});
