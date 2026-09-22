/**
 * Reject HTML / login pages / broken downloads disguised as .xlsx/.xls.
 */

function peekText(bytes, max = 256) {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, max));
}

function looksLikeHtml(text) {
  const t = String(text || '').trimStart().toLowerCase();
  return (
    t.startsWith('<!doctype')
    || t.startsWith('<html')
    || t.startsWith('<head')
    || t.startsWith('<body')
    || t.includes('<html')
  );
}

function isZipXlsx(bytes) {
  return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b; // PK
}

function isOleXls(bytes) {
  return bytes.length >= 4
    && bytes[0] === 0xd0
    && bytes[1] === 0xcf
    && bytes[2] === 0x11
    && bytes[3] === 0xe0;
}

function isJsonText(text) {
  const t = String(text || '').trimStart();
  return t.startsWith('{') || t.startsWith('[');
}

/**
 * @param {Blob|ArrayBuffer|Uint8Array} data
 * @param {string} [filename]
 */
export async function assertSpreadsheetPayload(data, filename = '') {
  let bytes;
  if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data);
  } else if (ArrayBuffer.isView(data)) {
    bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  } else if (data instanceof Blob) {
    bytes = new Uint8Array(await data.slice(0, 512).arrayBuffer());
  } else {
    throw new Error('Пустой ответ сервера');
  }

  if (!bytes.length) {
    throw new Error('Файл пуст');
  }

  const head = peekText(bytes);
  if (looksLikeHtml(head)) {
    throw new Error(
      filename
        ? 'Файл похож на HTML-страницу (часто сохранённая страница входа), а не на Excel. Скачайте шаблон кнопкой «Скачать шаблон» и загрузите именно .xlsx.'
        : 'Сервер вернул HTML вместо Excel (часто страница входа). Войдите снова и скачайте шаблон заново.',
    );
  }

  const name = String(filename || '').toLowerCase();
  if (name.endsWith('.json') || (!name && isJsonText(head))) {
    if (isJsonText(head)) return;
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls') || !name) {
    if (isZipXlsx(bytes) || isOleXls(bytes) || isJsonText(head)) return;
    throw new Error(
      'Файл не похож на Excel (.xlsx/.xls). Скачайте шаблон в системе и сохраните как .xlsx — не HTML из браузера.',
    );
  }
}

/** Before upload: validate user-picked File. */
export async function assertSpreadsheetFile(file) {
  if (!file) throw new Error('Файл не выбран');
  await assertSpreadsheetPayload(file, file.name);
}

/** Before saving export/template blob from API. */
export async function assertAndDownloadSpreadsheet(blobData, filenamePrefix) {
  const blob = blobData instanceof Blob
    ? blobData
    : new Blob([blobData], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  await assertSpreadsheetPayload(blob, `${filenamePrefix}.xlsx`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
