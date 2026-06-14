import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { ExecutiveChartDay } from '../../api/types';
import { chartMax } from '../../utils/chartGeometry';

interface ProfitByDayChartProps {
  days: ExecutiveChartDay[];
}

const CHART_HEIGHT = 140;

export function ProfitByDayChart({ days }: ProfitByDayChartProps) {
  const { t } = useTranslation();
  const profits = days.map((d) => Number(d.netProfit) || 0);
  const maxProfit = Math.max(...profits, 0);
  const maxValue = chartMax(profits.map((p) => Math.abs(p)));

  return (
    <Card>
      <Text style={styles.title}>{t('trends.profitByDay')}</Text>
      <View style={styles.chart}>
        {days.map((day) => {
          const profit = Number(day.netProfit) || 0;
          const height = (Math.abs(profit) / maxValue) * CHART_HEIGHT;
          const isMax = profit > 0 && profit === maxProfit && maxProfit > 0;
          const isNegative = profit < 0;
          return (
            <View key={day.date} style={styles.column}>
              {isMax ? <Text style={styles.maxBadge}>{t('trends.max')}</Text> : <View style={styles.maxSpacer} />}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(height, 4),
                      backgroundColor: isMax
                        ? colors.primary
                        : isNegative
                          ? colors.expense
                          : '#93C5FD',
                    },
                  ]}
                />
              </View>
              <Text style={styles.dayLabel}>{day.date.slice(8)}.{day.date.slice(5, 7)}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: CHART_HEIGHT + 28,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  maxBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  maxSpacer: {
    height: 13,
  },
  barTrack: {
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    width: '100%',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 9,
    color: colors.textLight,
    marginTop: 6,
  },
});
