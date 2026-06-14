import { Text, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { DeltaBadge } from '../ui/DeltaBadge';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { formatMoney } from '../../utils/formatMoney';

interface SalesHeroCardProps {
  amount: number;
  salesCount: number;
  salesPercent: number;
}

export function SalesHeroCard({ amount, salesCount, salesPercent }: SalesHeroCardProps) {
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <Text style={styles.label}>{t('today.salesToday')}</Text>
      <Text style={styles.amount}>{formatMoney(amount, t)}</Text>
      <View style={styles.footer}>
        <View style={styles.badge}>
          <Ionicons name="receipt-outline" size={14} color={colors.primary} />
          <Text style={styles.badgeText}>{t('today.receipts', { count: salesCount })}</Text>
        </View>
        <DeltaBadge value={salesPercent} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.xl,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.incomeBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  badgeText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});
