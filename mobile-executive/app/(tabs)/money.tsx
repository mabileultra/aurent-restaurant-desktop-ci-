import { Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useExecutiveSummary } from '../../src/hooks/useExecutiveSummary';
import { Screen } from '../../src/components/ui/Screen';
import { MoneySummaryCards } from '../../src/components/money/MoneySummaryCards';
import { colors } from '../../src/theme/colors';

export default function MoneyScreen() {
  const { t } = useTranslation();
  const query = useExecutiveSummary('TODAY');
  const data = query.data;

  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>{t('money.title')}</Text>

      {query.isLoading ? <ActivityIndicator color={colors.primary} /> : null}

      {data ? (
        <MoneySummaryCards
          cashTotal={Number(data.cashTotal)}
          bankTotal={Number(data.bankTotal)}
          moneyTotal={Number(data.moneyTotal)}
          customerDebtTotal={Number(data.customerDebtTotal)}
          supplierDebtTotal={Number(data.supplierDebtTotal)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
});
