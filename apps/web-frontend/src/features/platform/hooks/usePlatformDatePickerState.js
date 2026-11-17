import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addDays, addMonths, addYears, subMonths, subYears } from 'date-fns';
import {
  formatDisplayDate,
  formatMonthTitle,
  getMonthGridDays,
  getPickerText,
  toIsoDate,
} from '../utils/platformDatePickerUtils';

export function usePlatformDatePickerState({
  value = '',
  onChange,
  min = '',
  max = '',
  placeholder,
  disabled = false,
  quickDays = [7, 15, 30],
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
  const selectedIso = useMemo(() => toIsoDate(value), [value]);
  const minIso = useMemo(() => toIsoDate(min), [min]);
  const maxIso = useMemo(() => toIsoDate(max), [max]);

  const [cursorDate, setCursorDate] = useState(() => {
    if (selectedIso && /^\d{4}-\d{2}-\d{2}$/.test(selectedIso)) {
      const parts = selectedIso.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, 1);
    }
    return new Date();
  });

  const [effectiveAlign, setEffectiveAlign] = useState(align);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (align === 'right') {
        setEffectiveAlign('right');
      } else if (containerRef.current && typeof window !== 'undefined') {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.left + 340 > window.innerWidth - 16) {
          setEffectiveAlign('right');
        } else {
          setEffectiveAlign(align || 'left');
        }
      }
    }
  }, [isOpen, align]);

  // Sync cursor when value changes externally
  useEffect(() => {
    if (!isOpen && selectedIso && /^\d{4}-\d{2}-\d{2}$/.test(selectedIso)) {
      const parts = selectedIso.split('-').map(Number);
      setCursorDate(new Date(parts[0], parts[1] - 1, 1));
    }
  }, [selectedIso, isOpen]);

  // Click outside and Escape listeners
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleDocumentClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      if (selectedIso && /^\d{4}-\d{2}-\d{2}$/.test(selectedIso)) {
        const parts = selectedIso.split('-').map(Number);
        setCursorDate(new Date(parts[0], parts[1] - 1, 1));
      } else {
        setCursorDate(new Date());
      }
    }
    setIsOpen((prev) => !prev);
  };

  const handlePickDate = (iso) => {
    if (onChange) {
      onChange(iso);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    if (onChange) {
      onChange('');
    }
    setIsOpen(false);
  };

  const handleQuickDay = (daysCount) => {
    const target = addDays(new Date(), daysCount);
    const iso = toIsoDate(target);
    if (minIso && iso < minIso) return;
    if (maxIso && iso > maxIso) return;
    handlePickDate(iso);
  };

  const shiftMonth = (delta) => {
    setCursorDate((prev) => (delta < 0 ? subMonths(prev, 1) : addMonths(prev, 1)));
  };

  const shiftYear = (delta) => {
    setCursorDate((prev) => (delta < 0 ? subYears(prev, 1) : addYears(prev, 1)));
  };

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const days = useMemo(() => getMonthGridDays(cursorDate), [cursorDate]);
  const monthTitle = useMemo(() => formatMonthTitle(cursorDate, isRu), [cursorDate, isRu]);
  const weekdays = useMemo(
    () => (isRu ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']),
    [isRu],
  );

  const hasValue = Boolean(selectedIso);
  const displayText = useMemo(() => {
    if (selectedIso) {
      return formatDisplayDate(selectedIso);
    }
    return placeholder || getPickerText('placeholderSingle', lang, t);
  }, [selectedIso, placeholder, lang, t]);

  const isTodayDisabled = Boolean((minIso && todayIso < minIso) || (maxIso && todayIso > maxIso));

  return {
    t,
    lang,
    containerRef,
    isOpen,
    setIsOpen,
    toggleOpen,
    effectiveAlign,
    selectedIso,
    minIso,
    maxIso,
    todayIso,
    monthTitle,
    weekdays,
    days,
    hasValue,
    displayText,
    isTodayDisabled,
    handlePickDate,
    handleClear,
    handleQuickDay,
    shiftMonth,
    shiftYear,
  };
}
