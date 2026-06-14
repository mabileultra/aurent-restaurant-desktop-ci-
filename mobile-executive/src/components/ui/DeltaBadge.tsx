import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { formatPercent, isPositiveTrend } from '../../utils/formatPercent';

interface DeltaBadgeProps {
  value: number;
  invert?: boolean;
}

export function DeltaBadge({ value, invert = false }: DeltaBadgeProps) {
  const positive = isPositiveTrend(value);
  const good = invert ? !positive : positive;
  const color = good ? colors.income : colors.expense;
  const icon = positive ? 'arrow-up' : 'arrow-down';

  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.text, { color }]}>{formatPercent(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
