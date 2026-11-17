import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addMonths, addYears, subMonths, subYears } from 'date-fns';
import {
  formatMonthTitle,
  getMonthGridDays,
  getPresets,
  toIsoDate,
} from '../utils/platformDatePickerUtils';
import {
  calculateEffectiveRange,
  calculateNextRangeStep,
} from '../utils/dateRangeSelectionHelpers';
import {
  formatRangeDisplayText,
  formatRangeFooterText,
} from '../utils/dateRangeLabelHelpers';
import { usePlatformDateRangeDropdown } from './usePlatformDateRangeDropdown';

export function usePlatformDateRangeState({
  from = '',
  to = '',
  onChange,
  placeholder,
  disabled = false,
  align = 'left',
  t: propT,
}) {
  let hookT = null;
  let i18n = null;
  try {
    const res = useTranslation();
    hookT = res.t;
    i18n = res.i18n;
  } catch {
    // Graceful fallback when rendered outside I18nextProvider
  }
  const t = propT || hookT;
  const lang = i18n?.language?.startsWith('ru') ? 'ru' : 'uz';
  const isRu = lang === 'ru';

  const [isOpen, setIsOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from || '');
  const [draftTo, setDraftTo] = useState(to || '');
  const [selectionStep, setSelectionStep] = useState('start');
  const [hoverDate, setHoverDate] = useState('');
  const [cursorDate, setCursorDate] = useState(() => {
    const initIso = from || to;
    if (initIso && /^\d{4}-\d{2}-\d{2}$/.test(initIso)) {
      const parts = initIso.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, 1);
    }
    return new Date();
  });

  const containerRef = useRef(null);

  const { effectiveAlign } = usePlatformDateRangeDropdown({
    isOpen,
    setIsOpen,
    containerRef,
    align,
    from,
    to,
    setDraftFrom,
    setDraftTo,
    setSelectionStep,
    setHoverDate,
    setCursorDate,
  });

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      setDraftFrom(from || '');
      setDraftTo(to || '');
      setSelectionStep('start');
      setHoverDate('');
      const initIso = from || to;
      if (initIso && /^\d{4}-\d{2}-\d{2}$/.test(initIso)) {
        const parts = initIso.split('-').map(Number);
        setCursorDate(new Date(parts[0], parts[1] - 1, 1));
      } else {
        setCursorDate(new Date());
      }
    }
    setIsOpen((prev) => !prev);
  };

  const resetSelection = (nextFrom = '', nextTo = '') => {
    setDraftFrom(nextFrom);
    setDraftTo(nextTo);
    setSelectionStep('start');
    setHoverDate('');
    setIsOpen(false);
  };

  const handleApply = () => {
    const finalTo = draftTo || draftFrom;
    onChange?.({ from: draftFrom, to: finalTo }, draftFrom, finalTo);
    setIsOpen(false);
  };

  const handleCancel = () => {
    resetSelection(from || '', to || '');
  };

  const handleClear = () => {
    resetSelection('', '');
    onChange?.({ from: '', to: '' }, '', '');
  };

  const handlePresetClick = (preset) => {
    const { from: pFrom, to: pTo } = preset.range;
    resetSelection(pFrom, pTo);
    onChange?.({ from: pFrom, to: pTo }, pFrom, pTo);
  };

  const handleDayClick = (dayIso) => {
    const next = calculateNextRangeStep(draftFrom, draftTo, selectionStep, dayIso);
    setDraftFrom(next.draftFrom);
    setDraftTo(next.draftTo);
    setSelectionStep(next.selectionStep);
  };

  const handleDayMouseEnter = (dayIso, isDayDisabled) => {
    if (isDayDisabled) return;
    if (selectionStep === 'end' && draftFrom) setHoverDate(dayIso);
  };

  const shiftMonth = (delta) => setCursorDate((prev) => (delta < 0 ? subMonths(prev, 1) : addMonths(prev, 1)));
  const shiftYear = (delta) => setCursorDate((prev) => (delta < 0 ? subYears(prev, 1) : addYears(prev, 1)));
  const handleDayMouseLeave = () => { if (hoverDate) setHoverDate(''); };

  const { effectiveFrom, effectiveTo } = calculateEffectiveRange(
    draftFrom,
    draftTo,
    selectionStep,
    hoverDate
  );

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const presets = useMemo(() => getPresets(new Date()), []);
  const days = useMemo(() => getMonthGridDays(cursorDate), [cursorDate]);
  const monthTitle = useMemo(() => formatMonthTitle(cursorDate, isRu), [cursorDate, isRu]);
  const weekdays = useMemo(
    () => (isRu ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']),
    [isRu],
  );

  const hasValue = Boolean(from || to);
  const displayText = useMemo(
    () => formatRangeDisplayText({ from, to, placeholder, lang, t }),
    [from, to, placeholder, lang, t]
  );

  const footerText = useMemo(
    () => formatRangeFooterText({ draftFrom, draftTo, lang, t }),
    [draftFrom, draftTo, lang, t]
  );

  return {
    t,
    lang,
    containerRef,
    isOpen,
    setIsOpen,
    draftFrom,
    setDraftFrom,
    draftTo,
    setDraftTo,
    setSelectionStep,
    effectiveAlign,
    toggleOpen,
    handleApply,
    handleCancel,
    handleClear,
    handlePresetClick,
    handleDayClick,
    handleDayMouseEnter,
    handleDayMouseLeave,
    shiftMonth,
    shiftYear,
    effectiveFrom,
    effectiveTo,
    todayIso,
    presets,
    days,
    monthTitle,
    weekdays,
    hasValue,
    displayText,
    footerText,
  };
}
