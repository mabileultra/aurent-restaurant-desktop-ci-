import { useState } from 'react';
import { isMarkingCode, marksShareIdentity, preserveMarkingCodeForFiscal } from '../../marking';
import { checkPharmacyReturnMark } from '../utils/checkPharmacyReturnMark';

const TEXT = {
  foreign: 'Маркировка принадлежит другой организации, не нашей компании',
  ours: 'Это наш товар, можно вернуть',
  notOnReceipt: 'Это наш товар, но его нет в этом чеке',
  unconfirmed: 'Владельца подтвердить не удалось. Возврат по этому коду не проводим.',
  notCode: 'Это не код маркировки',
  duplicate: 'Этот код уже отсканирован',
};

function flattenMarks(byLine) {
  return Object.values(byLine).flat();
}

/** Скан КМ в возврате аптеки. Чужой код не принимается. */
export default function PharmacyReturnMarkScan({ sale, cashRegisterId, onAccept }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [marksByLine, setMarksByLine] = useState({});

  const apply = async (raw) => {
    const text = String(raw || '').trim();
    if (!text || busy) return;
    if (!isMarkingCode(text)) {
      setNotice({ tone: 'bad', text: TEXT.notCode });
      return;
    }
    const mark = preserveMarkingCodeForFiscal(text) || text;
    if (flattenMarks(marksByLine).some((saved) => marksShareIdentity(saved, mark))) {
      setNotice({ tone: 'bad', text: TEXT.duplicate });
      setValue('');
      return;
    }
    setBusy(true);
    try {
      const result = await checkPharmacyReturnMark({ cashRegisterId, mark, sale });
      if (result.status === 'foreign') {
        setNotice({ tone: 'bad', text: TEXT.foreign });
        return;
      }
      if (result.status === 'rejected') {
        setNotice({ tone: 'bad', text: result.message || TEXT.foreign });
        return;
      }
      if (result.status === 'not-on-receipt') {
        setNotice({ tone: 'bad', text: TEXT.notOnReceipt });
        return;
      }
      if (result.status !== 'ours' || !result.line) {
        setNotice({ tone: 'warn', text: TEXT.unconfirmed });
        return;
      }
      const lineId = result.line.id;
      const nextMarks = [...(marksByLine[lineId] || []), mark];
      const nextMap = { ...marksByLine, [lineId]: nextMarks };
      setMarksByLine(nextMap);
      onAccept?.(lineId, nextMarks.length, nextMarks);
      setNotice({ tone: 'ok', text: `${TEXT.ours}${result.name ? `: ${result.name}` : ''}` });
      setValue('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pharmacy-return-mark">
      <label className="pharmacy-return-mark__label" htmlFor="pharmacy-return-mark">
        Маркировка
      </label>
      <input
        id="pharmacy-return-mark"
        className="pharmacy-return-mark__input"
        value={value}
        disabled={busy}
        placeholder="Скан кода маркировки"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            apply(value);
          }
        }}
      />
      {notice ? (
        <p className={`pharmacy-return-mark__notice is-${notice.tone}`}>{notice.text}</p>
      ) : (
        <p className="pharmacy-return-mark__hint">Без маркировки позицию можно вернуть по чеку. Каждый скан — одна упаковка.</p>
      )}
    </div>
  );
}
