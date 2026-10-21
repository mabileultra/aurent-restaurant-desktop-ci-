import { useState } from 'react';
import { BaseButton } from '../../../components/ui';
import {
  isPosSoundsEnabled,
  playPosSound,
  setPosSoundsEnabled,
  unlockPosAudio,
} from '../utils/posSounds';

export default function PosSoundToggle({ t }) {
  const [on, setOn] = useState(() => isPosSoundsEnabled());

  const toggle = () => {
    const next = !on;
    setPosSoundsEnabled(next);
    setOn(next);
    unlockPosAudio();
    if (next) playPosSound('success');
  };

  return (
    <BaseButton
      type="button"
      variant="ghost"
      onClick={toggle}
      title={on
        ? t('rst.pos.soundsEnabledHint', { defaultValue: 'Звуки включены' })
        : t('rst.pos.soundsDisabledHint', { defaultValue: 'Звуки выключены' })}
      aria-pressed={on}
    >
      {on
        ? t('rst.pos.soundsOn', { defaultValue: 'Звук' })
        : t('rst.pos.soundsOff', { defaultValue: 'Без звука' })}
    </BaseButton>
  );
}
