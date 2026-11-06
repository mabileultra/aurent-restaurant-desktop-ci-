const BASE = '/public-site/equipment';

/** Локальные фото оборудования (Pexels, free to use). */
export function localEquipmentMedia(fileName, alt) {
  const image = `${BASE}/${fileName}`;
  return {
    image,
    srcSet: `${image} 800w`,
    alt,
  };
}
