import { localEquipmentMedia } from './publicSiteEquipmentMedia';

/** Оборудование, которое предоставляет Aurent (6 позиций). */
export const PUBLIC_EQUIPMENT_ITEMS = [
  {
    id: 'posMonitor',
    ...localEquipmentMedia('pos-monitor.jpg', 'POS-монитор с сенсорным экраном'),
  },
  {
    id: 'receiptPrinter',
    ...localEquipmentMedia('receipt-printer.jpg', 'Принтер чеков на кассе'),
  },
  {
    id: 'barcodeScanner',
    ...localEquipmentMedia('barcode-scanner.jpg', 'Сканер штрихкодов'),
  },
  {
    id: 'cashDrawer',
    ...localEquipmentMedia('cash-drawer.jpg', 'Кассовый терминал и оплата на кассе'),
  },
  {
    id: 'scales',
    ...localEquipmentMedia('scales.jpg', 'Торговые весы с POS-терминалом'),
  },
  {
    id: 'customerDisplay',
    ...localEquipmentMedia('customer-display.jpg', 'Экран покупателя на кассе'),
  },
];
