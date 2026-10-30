/** Stable Excel columns for menu dish import/export (headers + aliases). */

export const MENU_DISH_COLUMNS = [
  {
    key: 'name',
    header: 'name',
    aliases: ['name', 'наименование', 'название', 'блюдо', 'nom', 'taom'],
    required: true,
  },
  {
    key: 'sku',
    header: 'sku',
    aliases: ['sku', 'артикул', 'artikul'],
  },
  {
    key: 'price',
    header: 'price',
    aliases: ['price', 'цена', 'narx', 'cost'],
    required: true,
  },
  {
    key: 'taxRate',
    header: 'taxRate',
    aliases: ['taxrate', 'tax_rate', 'ндс', 'ндс%', 'vat'],
  },
  {
    key: 'available',
    header: 'available',
    aliases: ['available', 'доступно', 'в_продаже', 'active', 'активно'],
  },
  {
    key: 'sortOrder',
    header: 'sortOrder',
    aliases: ['sortorder', 'sort_order', 'сортировка', 'порядок'],
  },
  {
    key: 'category',
    header: 'category',
    aliases: ['category', 'категория', 'раздел', 'menu_category', 'menucategory'],
  },
  {
    key: 'station',
    header: 'station',
    aliases: ['station', 'станция', 'кухня', 'kitchen'],
  },
  {
    key: 'description',
    header: 'description',
    aliases: ['description', 'описание', 'tavsif'],
  },
  {
    key: 'prepMinutes',
    header: 'prepMinutes',
    aliases: ['prepminutes', 'prep_minutes', 'минуты', 'готовка', 'prep'],
  },
  {
    key: 'portionAmount',
    header: 'portionAmount',
    aliases: ['portionamount', 'portion_amount', 'порция', 'вес', 'amount'],
  },
  {
    key: 'portionUnit',
    header: 'portionUnit',
    aliases: ['portionunit', 'portion_unit', 'единица_порции', 'unit'],
  },
  {
    key: 'portionLabel',
    header: 'portionLabel',
    aliases: ['portionlabel', 'portion_label', 'метка_порции', 'label'],
  },
  {
    key: 'tags',
    header: 'tags',
    aliases: ['tags', 'теги', 'метки'],
  },
  {
    key: 'ikpu',
    header: 'ikpu',
    aliases: ['ikpu', 'икпу', 'mxik', 'мхик'],
  },
  {
    key: 'packageCode',
    header: 'packageCode',
    aliases: ['packagecode', 'package_code', 'код_упаковки', 'packcode'],
  },
  {
    key: 'unitOfMeasure',
    header: 'unitOfMeasure',
    aliases: ['unitofmeasure', 'unit_of_measure', 'ед_изм', 'единица'],
  },
  {
    key: 'unitMeasureCode',
    header: 'unitMeasureCode',
    aliases: ['unitmeasurecode', 'unit_measure_code', 'код_ед'],
  },
  {
    key: 'barcode',
    header: 'barcode',
    aliases: ['barcode', 'штрихкод', 'штрих-код', 'ean'],
  },
  {
    key: 'markedProduct',
    header: 'markedProduct',
    aliases: ['markedproduct', 'marked_product', 'маркировка', 'marked'],
  },
  {
    key: 'imageUrl',
    header: 'imageUrl',
    aliases: ['imageurl', 'image_url', 'фото', 'photo', 'image'],
  },
  {
    key: 'tasnifQuery',
    header: 'tasnifQuery',
    aliases: ['tasnifquery', 'tasnif_query', 'тасниф', 'поиск_тасниф', 'mxik_query'],
  },
];

export const MENU_DISH_HEADERS = MENU_DISH_COLUMNS.map((col) => col.header);

export function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, '_')
    .replace(/[^\p{L}\p{N}_%]/gu, '');
}

export function mapHeaderToKey(header) {
  const norm = normalizeHeader(header);
  if (!norm) return null;
  for (const col of MENU_DISH_COLUMNS) {
    if (col.aliases.some((alias) => normalizeHeader(alias) === norm)) {
      return col.key;
    }
  }
  return null;
}
