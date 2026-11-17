export function productAttr(productOrLine, ...keys) {
  const attrs = productOrLine?.attributes;
  if (attrs && typeof attrs === 'object') {
    for (const key of keys) {
      const value = attrs[key];
      if (value != null && String(value).trim()) {
        return String(value).trim();
      }
    }
  }
  for (const key of keys) {
    const direct = productOrLine?.[key];
    if (direct != null && String(direct).trim()) {
      return String(direct).trim();
    }
  }
  return '';
}
