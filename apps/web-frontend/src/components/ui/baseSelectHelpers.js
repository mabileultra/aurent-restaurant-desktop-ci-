export function toOptionValue(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function optionSearchText(option) {
  return [option?.label, option?.value, option?.keywords]
    .flat()
    .filter((part) => part != null && String(part).trim() !== '')
    .join(' ')
    .toLowerCase();
}

export function filterVisibleOptions(options, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return options;
  return options.filter((option) => {
    if (toOptionValue(option.value) === '') return false;
    return optionSearchText(option).includes(q);
  });
}
