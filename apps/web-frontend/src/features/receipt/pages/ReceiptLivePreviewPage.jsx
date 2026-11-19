import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiscalReceiptBody } from '../../../components/receipt';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import {
  PAPER_WIDTH_58_MM,
  PAPER_WIDTH_80_MM,
  PAPER_WIDTH_STYLE,
} from '../constants/receiptPaperConstants';
import { PRESETS } from '../constants/receiptPreviewPresets';
import ReceiptPreviewHeader from '../components/ReceiptPreviewHeader';
import ReceiptPreviewSidebar from '../components/ReceiptPreviewSidebar';

export default function ReceiptLivePreviewPage() {
  const { i18n } = useTranslation();
  const [selectedPresetId, setSelectedPresetId] = useState('soliq-full');
  const [paperWidthMm, setPaperWidthMm] = useState(PAPER_WIDTH_80_MM);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    i18n.changeLanguage('uz');
    useTenantDisplayStore.getState().hydrateFromPayload({
      receiptCompanyName: 'OOO "MAKRO-RETAIL"',
      receiptCompanyAddress: 'Toshkent sh., Chilonzor t., 12-mavze, 4-uy',
      receiptCompanyPhone: '+998 71 200 00 00',
      receiptStir: '305123456',
      receiptFields: {
        logo: false,
        companyName: true,
        companyAddress: true,
        companyPhone: false,
        stir: true,
        dateTime: true,
        receiptNo: true,
        employee: true,
        shift: true,
        items: true,
        itemVat: true,
        itemVatLine: true,
        itemIkpu: true,
        grandTotal: true,
        vatTotal: true,
        payment: true,
        receiptType: true,
        fiscalBlock: true,
        qrCode: true,
      },
    });
  }, [i18n]);

  const activePreset = PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[0];

  const handlePrint = () => {
    window.print();
  };

  const paperStyle = PAPER_WIDTH_STYLE[paperWidthMm] || PAPER_WIDTH_STYLE[PAPER_WIDTH_80_MM];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <ReceiptPreviewHeader
        paperWidthMm={paperWidthMm}
        setPaperWidthMm={setPaperWidthMm}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        onPrint={handlePrint}
        presets={PRESETS}
        selectedPresetId={selectedPresetId}
        setSelectedPresetId={setSelectedPresetId}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 items-start justify-center">
        <ReceiptPreviewSidebar
          activePreset={activePreset}
          showSettings={showSettings}
        />

        <div className="order-1 md:order-2 flex flex-col items-center justify-center w-full">
          <div
            className="transition-all duration-200 bg-white text-black shadow-2xl rounded-sm print:shadow-none print:rounded-none overflow-hidden"
            style={{
              width: paperStyle.width,
              maxWidth: '100%',
              padding: paperStyle.padding,
            }}
          >
            <div className="w-full border-b border-dashed border-slate-300 mb-3 pb-1 text-center text-[10px] text-slate-400 tracking-widest uppercase print:hidden select-none">
              — Termal Chek Qog‘ozi ({paperWidthMm} mm) —
            </div>

            <FiscalReceiptBody sale={activePreset.sale} />

            <div className="w-full border-t border-dashed border-slate-300 mt-4 pt-1 text-center text-[10px] text-slate-400 tracking-widest uppercase print:hidden select-none">
              — Qirqish chizig‘i —
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
