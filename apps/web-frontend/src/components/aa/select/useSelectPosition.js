import { useState, useEffect, useCallback } from 'react';

export const SELECT_POSITION_CONSTANTS = {
  TARGET_LIST_MAX_HEIGHT: 320,
  MIN_LIST_HEIGHT: 80,
  MIN_PANEL_WIDTH: 240,
  MAX_PANEL_WIDTH: 360,
  GAP: 4,
  SCREEN_PADDING: 8,
  SEARCH_HEADER_HEIGHT: 44, // qidiruv maydoni balandligi + margin
  PANEL_PADDING: 8, // tepa va pastki paddinglar
};

/**
 * calculateSelectPosition — Select ro‘yxat koordinatalari va balandligini hisoblovchi toza funksiya.
 */
export function calculateSelectPosition({
  triggerRect,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1440,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900,
  isSearchable = false,
}) {
  if (!triggerRect) {
    return {
      top: undefined,
      bottom: undefined,
      left: 0,
      width: SELECT_POSITION_CONSTANTS.MIN_PANEL_WIDTH,
      maxHeight: SELECT_POSITION_CONSTANTS.TARGET_LIST_MAX_HEIGHT,
      placement: 'bottom',
    };
  }

  const {
    TARGET_LIST_MAX_HEIGHT,
    MIN_LIST_HEIGHT,
    MIN_PANEL_WIDTH,
    MAX_PANEL_WIDTH,
    GAP,
    SCREEN_PADDING,
    SEARCH_HEADER_HEIGHT,
    PANEL_PADDING,
  } = SELECT_POSITION_CONSTANTS;

  // 1. Kenglik: max(trigger kengligi, 240px), ko‘pi bilan 360px
  const width = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, triggerRect.width || 0));

  // 2. Gorizontal joylashuv (ekrandan chiqib ketmasligi uchun)
  const maxLeft = Math.max(SCREEN_PADDING, viewportWidth - width - SCREEN_PADDING);
  const left = Math.min(Math.max(SCREEN_PADDING, triggerRect.left || 0), maxLeft);

  // 3. Pastda va tepada qolgan bo‘sh joylar
  const spaceBelow = Math.max(0, viewportHeight - (triggerRect.bottom || 0) - GAP - SCREEN_PADDING);
  const spaceAbove = Math.max(0, (triggerRect.top || 0) - GAP - SCREEN_PADDING);

  // Panel uchun umumiy talab qilingan to‘liq balandlik
  const extraHeight = (isSearchable ? SEARCH_HEADER_HEIGHT : 0) + PANEL_PADDING;
  const fullPanelHeight = TARGET_LIST_MAX_HEIGHT + extraHeight;

  // 4. Joylashuv yo‘nalishini aniqlash:
  // - Panel pastga sig‘sa — pastga ochiladi.
  // - Sig‘masa va tepada joy ko‘proq bo‘lsa — tepaga ochiladi.
  // - Ikkalasida ham sig‘masa — ko‘proq joy bor tomonga ochiladi.
  let placement = 'bottom';
  if (spaceBelow >= fullPanelHeight) {
    placement = 'bottom';
  } else if (spaceAbove >= fullPanelHeight) {
    placement = 'top';
  } else {
    placement = spaceAbove > spaceBelow ? 'top' : 'bottom';
  }

  // 5. Ro‘yxatning max-height’ini hisoblash (ekran chetidan 8px qoldiriladi)
  const availableSpace = placement === 'top' ? spaceAbove : spaceBelow;
  const maxHeight = Math.max(
    MIN_LIST_HEIGHT,
    Math.min(TARGET_LIST_MAX_HEIGHT, availableSpace - extraHeight)
  );

  return {
    top: placement === 'bottom' ? (triggerRect.bottom || 0) + GAP : undefined,
    bottom: placement === 'top' ? viewportHeight - (triggerRect.top || 0) + GAP : undefined,
    left,
    width,
    maxHeight,
    placement,
  };
}

/**
 * useSelectPosition — Select ro‘yxat panelining koordinatalarini hisoblash hooki.
 */
export function useSelectPosition(triggerRef, isOpen, isSearchable = false) {
  const [position, setPosition] = useState(() =>
    calculateSelectPosition({ triggerRect: null, isSearchable })
  );

  const updatePosition = useCallback(() => {
    if (!triggerRef?.current || !isOpen) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const nextPos = calculateSelectPosition({
      triggerRect: rect,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      isSearchable,
    });
    setPosition(nextPos);
  }, [triggerRef, isOpen, isSearchable]);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  return position;
}
