import { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { ExecutiveChartDay, ExecutivePeriod } from '../../api/types';
import { chartMax, toPolylinePoints } from '../../utils/chartGeometry';
import { formatChartDayLabel } from '../../utils/chartLabels';
import { formatMoney } from '../../utils/formatMoney';

interface IncomeExpenseLineChartProps {
  days: ExecutiveChartDay[];
  period: ExecutivePeriod;
}

const CHART_HEIGHT = 180;

export function IncomeExpenseLineChart({ days, period }: IncomeExpenseLineChartProps) {
  const { t, i18n } = useTranslation();
  const [width, setWidth] = useState(0);
  const incomes = days.map((d) => Number(d.income) || 0);
  const expenses = days.map((d) => Number(d.expense) || 0);
  const max = chartMax([...incomes, ...expenses]);

  const incomePoints = width > 0 ? toPolylinePoints(incomes, width, CHART_HEIGHT, max) : '';
  const expensePoints = width > 0 ? toPolylinePoints(expenses, width, CHART_HEIGHT, max) : '';

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>{t('trends.incomeVsExpense')}</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.income }]} />
            <Text style={styles.legendText}>{t('trends.revenue')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.expense }]} />
            <Text style={styles.legendText}>{t('trends.expenses')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartBox} onLayout={onLayout}>
        {width > 0 ? (
          <Svg width={width} height={CHART_HEIGHT}>
            {incomePoints ? (
              <Polyline
                points={incomePoints}
                fill="none"
                stroke={colors.income}
                strokeWidth={2.5}
              />
            ) : null}
            {expensePoints ? (
              <Polyline
                points={expensePoints}
                fill="none"
                stroke={colors.expense}
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            ) : null}
          </Svg>
        ) : null}
      </View>

      <View style={styles.labels}>
        {days.map((day) => (
          <Text key={day.date} style={styles.label}>
            {formatChartDayLabel(day.date, period, i18n.language)}
          </Text>
        ))}
      </View>

      {days.length > 0 ? (
        <Text style={styles.hint}>
          {t('trends.lastDayIncome')}: {formatMoney(days[days.length - 1].income, t)}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
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
  chartBox: {
    height: CHART_HEIGHT,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  label: {
    fontSize: 10,
    color: colors.textLight,
    flex: 1,
    textAlign: 'center',
  },
  hint: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.textMuted,
  },
});
