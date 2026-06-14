import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { formatMoney } from '../../utils/formatMoney';
import type { ExecutiveExpenseItem } from '../../api/types';

interface ExpensesListProps {
  total: number;
  items: ExecutiveExpenseItem[];
  onShowAll?: () => void;
}

const ICONS = ['business-outline', 'cash-outline', 'car-outline', 'cart-outline', 'wallet-outline'];

export function ExpensesList({ total, items, onShowAll }: ExpensesListProps) {
  const { t } = useTranslation();
  const visible = items.slice(0, 3);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('today.expensesToday')}</Text>
        <Text style={styles.total}>{formatMoney(total, t)}</Text>
      </View>

      {visible.map((item, index) => (
        <View key={item.categoryName} style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons
              name={ICONS[index % ICONS.length] as keyof typeof Ionicons.glyphMap}
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.name}>{item.categoryName}</Text>
          </View>
          <Text style={styles.amount}>{formatMoney(item.amount, t)}</Text>
        </View>
      ))}

      {items.length > 3 && onShowAll ? (
        <Pressable style={styles.showAll} onPress={onShowAll}>
          <Text style={styles.showAllText}>{t('today.showAllExpenses')}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.expense,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  showAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  showAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.5,
  },
});
