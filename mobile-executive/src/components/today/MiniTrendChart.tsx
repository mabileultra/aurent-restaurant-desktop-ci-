import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { ExecutiveChartDay } from '../../api/types';

interface MiniTrendChartProps {
  days: ExecutiveChartDay[];
}

const CHART_HEIGHT = 120;

export function MiniTrendChart({ days }: MiniTrendChartProps) {
  const { t, i18n } = useTranslation();
  const chartDays = days.slice(-7);
  const maxValue = Math.max(
    ...chartDays.flatMap((d) => [Number(d.income) || 0, Number(d.expense) || 0]),
    1,
  );

  const dayLabels = chartDays.map((d, idx) => {
    if (idx === chartDays.length - 1) {
      return i18n.language === 'uz' ? 'BUGUN' : 'СЕГОДНЯ';
    }
    const date = new Date(d.date);
    return date.toLocaleDateString(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU', { weekday: 'short' })
      .slice(0, 2)
      .toUpperCase();
  });

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>{t('today.dynamics')}</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{t('today.days7')}</Text>
        </View>
      </View>

      <View style={styles.chart}>
        {chartDays.map((day, index) => {
          const incomeH = ((Number(day.income) || 0) / maxValue) * CHART_HEIGHT;
          const isToday = index === chartDays.length - 1;
          return (
            <View key={day.date} style={styles.column}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(incomeH, 4),
                      backgroundColor: isToday ? colors.primary : colors.income,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.labels}>
        {dayLabels.map((label, idx) => (
          <Text key={`${label}-${idx}`} style={styles.label}>{label}</Text>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.income }]} />
          <Text style={styles.legendText}>{t('today.income')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.expense }]} />
          <Text style={styles.legendText}>{t('today.expense')}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  chip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  chart: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  column: {
    flex: 1,
  },
  barTrack: {
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 6,
    width: '100%',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 10,
    color: colors.textLight,
    flex: 1,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
