import { BaseInput, BaseSelect } from '../../../../components/ui';
import RstFilterResetButton from '../../../shared/components/RstFilterResetButton';
import {
  RECEIPT_CHANNELS,
  RECEIPT_METHODS,
  RECEIPT_STATUSES,
  receiptChannelLabel,
  receiptMethodLabel,
  receiptStatusLabel,
} from '../../utils/receiptJournal';

/**
 * Shared filter row for restaurant reports. `fields` picks which controls to show;
 * `children` (e.g. the Excel button) render at the end of the row.
 */
export default function ReportFilterBar({
  t,
  filters,
  onChange,
  onReset,
  directory,
  fields = ['method', 'waiter', 'hall', 'channel'],
  methods = RECEIPT_METHODS,
  search,
  children,
}) {
  const has = (field) => fields.includes(field);
  const select = (key, label, options, searchable = false) => (
    <BaseSelect
      className="rst-admin-field"
      size="sm"
      searchable={searchable}
      label={label}
      value={filters[key]}
      onChange={(e) => onChange(key, e.target.value)}
      options={options}
    />
  );

  return (
    <div className="rst-admin-filters rst-journal__filters">
      {search ? (
        <label className="rst-admin-field rst-journal__search">
          <span className="rst-admin-field__label">{t('common.search')}</span>
          <BaseInput
            type="search"
            value={search.value}
            placeholder={search.placeholder}
            onChange={(e) => search.onChange(e.target.value)}
          />
        </label>
      ) : null}
      {has('method') ? select('method', t('rst.reports.checkMethod'), [
        { value: '', label: t('rst.reports.journal.allMethods') },
        ...methods.map((m) => ({ value: m, label: receiptMethodLabel(m, t) })),
      ]) : null}
      {has('status') ? select('status', t('rst.reports.journal.colStatus'), [
        { value: '', label: t('rst.reports.journal.allStatuses') },
        ...RECEIPT_STATUSES.map((s) => ({ value: s, label: receiptStatusLabel(s, t) })),
      ]) : null}
      {has('waiter')
        ? select('waiterUserId', t('rst.reports.journal.colWaiter'), directory.waiterOptions, true)
        : null}
      {has('hall') ? select('hallId', t('rst.reports.journal.colHall'), directory.hallOptions) : null}
      {has('channel') ? select('channel', t('rst.reports.journal.colChannel'), [
        { value: '', label: t('rst.reports.journal.allChannels') },
        ...RECEIPT_CHANNELS.map((c) => ({ value: c, label: receiptChannelLabel(c, t) })),
      ]) : null}
      <RstFilterResetButton t={t} onClick={onReset} />
      {children}
    </div>
  );
}
