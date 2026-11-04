export const MULTIKASSA_DEFAULT_BASE_URL = 'http://localhost:8080';

export const MULTIKASSA_BASE_URL_PRESETS = {
  local8080: 'http://localhost:8080',
  local12346: 'http://localhost:12346',
  cloudV3: 'https://v3.mkfiscal.uz',
  cloudV4: 'https://v4.mkfiscal.uz',
};

export const MULTIKASSA_OPERATION_TYPE = {
  OPEN_SHIFT: '1',
  CLOSE_SHIFT: '2',
  SALE: '3',
  REFUND: '4',
  X_REPORT: '7',
  ADVANCE: '8',
  CREDIT: '10',
};

export { FISCAL_STATUS } from '../fiscal/fiscalStatus';
