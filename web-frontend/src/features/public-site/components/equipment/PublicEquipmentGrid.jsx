import { useTranslation } from 'react-i18next';
import { PUBLIC_EQUIPMENT_ITEMS } from '../../constants/publicSiteMedia';
import PublicSectionTitle from '../shared/PublicSectionTitle';

export default function PublicEquipmentGrid({ showHeader = true }) {
  const { t } = useTranslation();

  return (
    <>
      {showHeader ? (
        <PublicSectionTitle
          eyebrowKey="publicSite.equipment.eyebrow"
          titleKey="publicSite.equipment.title"
          leadKey="publicSite.equipment.subtitle"
        />
      ) : null}
      <div className="public-equipment-grid">
        {PUBLIC_EQUIPMENT_ITEMS.map(({ id, image }) => (
          <article key={id} className="public-equipment-card">
            <h3 className="public-equipment-card__label">
              {t(`publicSite.equipment.items.${id}.title`)}
            </h3>
            <div className="public-equipment-card__media">
              <div className="public-equipment-card__glow" aria-hidden />
              <img
                className="public-equipment-card__img"
                src={image}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="public-equipment-card__desc">
              {t(`publicSite.equipment.items.${id}.desc`)}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
