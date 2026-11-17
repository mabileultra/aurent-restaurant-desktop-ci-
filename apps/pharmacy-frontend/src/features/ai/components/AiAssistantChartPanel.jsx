import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { CHART_PALETTE } from '../../../config/chartPalette';

export default function AiAssistantChartPanel({ data }) {
  const { t } = useTranslation();
  if (!Array.isArray(data) || data.length === 0) return null;

  return (
    <section className="ui-card-padded">
      <p className="mb-3 text-sm font-semibold text-ink">{t('aiAssistant.chartTitle')}</p>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} />
            <XAxis dataKey="name" tick={{ fill: CHART_PALETTE.axisText, fontSize: 11, fontFamily: CHART_PALETTE.fontFamily }} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: CHART_PALETTE.axisText, fontSize: 11, fontFamily: CHART_PALETTE.fontFamily }} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: CHART_PALETTE.axisText, fontSize: 11, fontFamily: CHART_PALETTE.fontFamily }} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: CHART_PALETTE.surface,
                border: `1px solid ${CHART_PALETTE.grid}`,
                borderRadius: 10,
              }}
            />
            <Bar yAxisId="left" dataKey="revenue" fill={CHART_PALETTE.primary} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="stockQty" fill={CHART_PALETTE.info} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
