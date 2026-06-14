import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { ExecutivePeriod } from '../../api/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface TrendsPeriodSwitcherProps {
  value: ExecutivePeriod;
  onChange: (period: ExecutivePeriod) => void;
  labels: Record<ExecutivePeriod, string>;
}

const PERIODS: ExecutivePeriod[] = ['TODAY', 'WEEK', 'MONTH'];

export function TrendsPeriodSwitcher({ value, onChange, labels }: TrendsPeriodSwitcherProps) {
  return (
    <View style={styles.wrap}>
      {PERIODS.map((period) => {
        const active = value === period;
        return (
          <Pressable
            key={period}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(period)}
          >
            <Text style={[styles.text, active && styles.textActive]}>{labels[period]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  textActive: {
    color: colors.text,
  },
});
