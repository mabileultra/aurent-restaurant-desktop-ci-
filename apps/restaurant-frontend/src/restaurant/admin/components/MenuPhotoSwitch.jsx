import { BaseButton } from '../../../components/ui';
import '../styles/menu-photos.css';

export default function MenuPhotoSwitch({ photos, t }) {
  return (
    <div className="rst-menu-photos">
      <span className={`rst-menu-photos__state${photos.enabled ? ' is-on' : ' is-off'}`}>
        {photos.enabled ? t('rst.admin.menuPhotosOn') : t('rst.admin.menuPhotosOff')}
      </span>
      <BaseButton type="button" disabled={photos.saving} onClick={photos.toggle}>
        {photos.enabled ? t('rst.admin.menuPhotosTurnOff') : t('rst.admin.menuPhotosTurnOn')}
      </BaseButton>
    </div>
  );
}
