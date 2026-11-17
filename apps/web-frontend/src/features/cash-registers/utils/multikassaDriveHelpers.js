import { MULTIKASSA_DEFAULT_BASE_URL } from '../../../services/multikassa';

export const EMPTY_FORM = {
  enabled: false,
  baseUrl: MULTIKASSA_DEFAULT_BASE_URL,
  terminalId: '',
  moduleNumber: '',
  selectedDriveId: '',
  cashierNameOverride: '',
  requireBeforeSale: false,
  printFiscalQr: true,
};

export function collectDriveArrays(raw, depth = 0) {
  if (raw == null || depth > 4) return [];
  if (Array.isArray(raw)) return [raw];
  if (typeof raw !== 'object') return [];
  if (Array.isArray(raw?.data?.drives)) return [raw.data.drives];
  if (Array.isArray(raw?.drives)) return [raw.drives];
  const keys = [
    'data',
    'Data',
    'Result',
    'result',
    'drives',
    'Drives',
    'fiscal_drives',
    'fiscalDrives',
    'items',
    'Items',
    'modules',
    'Modules',
    'list',
    'List',
  ];
  const found = [];
  for (const key of keys) {
    if (Array.isArray(raw[key])) found.push(raw[key]);
  }
  for (const value of Object.values(raw)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      found.push(...collectDriveArrays(value, depth + 1));
    }
  }
  return found;
}

export function pickDriveTerminal(item) {
  return (
    item.terminalID ||
    item.terminalId ||
    item.TerminalId ||
    item.TerminalID ||
    item.receipt_gnk_terminalid ||
    item.module_gnk_terminalid ||
    item.module_gnk_id ||
    ''
  );
}

export function normalizeDrivesList(raw) {
  const candidates = collectDriveArrays(raw);
  const list = candidates.find((arr) => arr.length > 0) || (Array.isArray(raw) ? raw : []);
  return list
    .map((item) => {
      if (item == null) return null;
      if (typeof item === 'string' || typeof item === 'number') {
        return { id: String(item), label: String(item) };
      }
      const terminal = String(pickDriveTerminal(item) || '').trim();
      const factory =
        item.factoryId ??
        item.FactoryID ??
        item.factory_id ??
        item.FactoryId ??
        null;
      const id =
        factory ??
        item.id ??
        item.Id ??
        item.driveId ??
        item.DriveId ??
        item.module_gnk_id ??
        item.ModuleGnkId ??
        (terminal || null) ??
        item.serial ??
        item.Serial ??
        item.serialNumber ??
        item.SerialNumber ??
        item.ModuleNumber ??
        item.moduleNumber ??
        item.number ??
        item.Number ??
        null;
      if (id == null || String(id).trim() === '') return null;
      const idStr = String(id).trim();
      const name =
        item.name ??
        item.Name ??
        item.title ??
        item.Title ??
        terminal ??
        '';
      return {
        id: idStr,
        label: terminal && terminal !== idStr ? `${terminal} (${idStr})` : name ? `${idStr} — ${name}` : idStr,
        terminalId: terminal || idStr,
        moduleNumber: terminal || idStr,
        factoryId: factory != null ? String(factory).trim() : idStr,
      };
    })
    .filter(Boolean)
    .map((d, index) => ({ ...d, key: `${d.id}-${index}` }));
}
