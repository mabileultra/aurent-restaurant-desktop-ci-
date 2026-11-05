/**
 * Та же пара, что CatalogSearchFold в shared-kernel.
 * SQLite LOWER не уменьшает кириллицу.
 */
const FROM =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  + 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'
  + 'ЎҚҒҲІ';

const TO =
  'abcdefghijklmnopqrstuvwxyz'
  + 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'
  + 'ўқғҳі';

if (FROM.length !== TO.length) {
  throw new Error('catalog search fold alphabets differ');
}

function fold(raw) {
  const text = String(raw || '');
  let out = '';
  for (const ch of text) {
    const at = FROM.indexOf(ch);
    out += at >= 0 ? TO[at] : ch;
  }
  return out;
}

/** sql.js в этой сборке не знает translate(); replace есть везде. */
function foldSql(columnExpr) {
  let expr = columnExpr;
  for (let i = 0; i < FROM.length; i += 1) {
    expr = `replace(${expr}, '${FROM[i]}', '${TO[i]}')`;
  }
  return expr;
}

module.exports = { FROM, TO, fold, foldSql };
