import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BaseInput, BaseModal } from '../../../../components/ui';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { toastApiError } from '../../../../utils/apiError';
import toast from 'react-hot-toast';
import { rstShiftApi } from '../../../api/shift.api';
import '../../styles/cash-drawer-modal.css';

const TYPES = ['IN', 'OUT', 'COLLECTION'];

export default function CashDrawerModal({ open, onClose, shift, t }) {
  const qc = useQueryClient();
  const [type, setType] = useState('IN');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');

  const opsQuery = useQuery({
    queryKey: ['rst-cash-ops', shift?.id],
    queryFn: () => rstShiftApi.listCashOps(shift.id).then((r) => r.data ?? []),
    enabled: open && Boolean(shift?.id),
  });

  const postMutation = useMutation({
    mutationFn: () => rstShiftApi.postCashOp(shift.id, {
      type,
      amount: Number(amount),
      comment: comment.trim() || null,
    }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rst-cash-ops', shift.id] });
      qc.invalidateQueries({ queryKey: ['rst-shift-current'] });
      setAmount('');
      setComment('');
      toast.success(t('rst.shift.cashOp.saved'));
    },
    onError: (err) => toastApiError(err, t('rst.shift.cashOp.failed')),
  });

  const expected = Number(shift?.expectedCash);
  const needsComment = type !== 'IN';
  const numeric = Number(amount);
  const canSubmit = Boolean(shift?.id)
    && Number.isFinite(numeric)
    && numeric > 0
    && (!needsComment || comment.trim())
    && !postMutation.isPending;

  return (
    <BaseModal
      open={open}
      title={t('rst.shift.cashOp.title')}
      onClose={onClose}
      size="md"
      footer={(
        <button
          type="button"
          className="rst-cash-drawer__submit"
          disabled={!canSubmit}
          onClick={() => postMutation.mutate()}
        >
          {t('rst.shift.cashOp.submit')}
        </button>
      )}
    >
      <p className="rst-cash-drawer__expected">
        <span>{t('rst.shift.expectedCash')}</span>
        <strong>{Number.isFinite(expected) ? fmtMoneyCompact(expected) : '—'}</strong>
      </p>

      <div className="rst-cash-drawer__types" role="radiogroup">
        {TYPES.map((key) => (
          <button
            key={key}
            type="button"
            className={`rst-cash-drawer__type${type === key ? ' is-active' : ''}`}
            onClick={() => setType(key)}
          >
            {t(`rst.shift.cashOp.type${key}`)}
          </button>
        ))}
      </div>

      <label className="rst-cash-drawer__field">
        <span>{t('rst.shift.cashOp.amount')}</span>
        <BaseInput
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <label className="rst-cash-drawer__field">
        <span>{t('rst.shift.cashOp.comment')}{needsComment ? ' *' : ''}</span>
        <BaseInput
          value={comment}
          maxLength={500}
          placeholder={t('rst.shift.cashOp.commentPh')}
          onChange={(e) => setComment(e.target.value)}
        />
      </label>

      <div className="rst-cash-drawer__list">
        <strong>{t('rst.shift.cashOp.history')}</strong>
        {opsQuery.isPending ? (
          <p>{t('common.loading')}</p>
        ) : (opsQuery.data ?? []).length === 0 ? (
          <p className="rst-cash-drawer__empty">{t('rst.shift.cashOp.empty')}</p>
        ) : (opsQuery.data ?? []).map((op) => (
          <div key={op.id} className="rst-cash-drawer__row">
            <span>{t(`rst.shift.cashOp.type${op.type}`)}</span>
            <span>{op.comment || '—'}</span>
            <strong>{fmtMoneyCompact(op.amount)}</strong>
          </div>
        ))}
      </div>
    </BaseModal>
  );
}
