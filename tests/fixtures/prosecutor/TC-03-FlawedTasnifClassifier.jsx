import React, { useState } from 'react';

/**
 * TC-03: FlawedTasnifClassifier.jsx
 * Ushbu komponent Modda 2 ni buzadi:
 * Frontend brauzerida og'ir backend tasniflash (classification) va IKPU taxmin qilish mantiqi bajarilgan.
 */

// XATO: Frontendda og'ir regex orqali mahsulotlarni tasniflash (classification)
const TASNIF_RULES = [
  { ikpu: '01111001001000000', regex: new RegExp('\\b(olma|apple|яблоко)\\b', 'i') },
  { ikpu: '01111001002000000', regex: new RegExp('\\b(nok|pear|груша)\\b', 'i') },
  { ikpu: '10711001001000000', regex: new RegExp('\\b(non|bread|хлеб|lepeshka)\\b', 'i') },
  { ikpu: '10511001001000000', regex: new RegExp('\\b(sut|milk|молоко)\\b', 'i') },
  { ikpu: '10811001001000000', regex: new RegExp('\\b(suv|water|вода|mineral)\\b', 'i') },
];

export function FlawedTasnifClassifier({ catalog = [] }) {
  const [classifiedResults, setClassifiedResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // QOIDABUZARLIK: Og'ir client-side classification loop
  const handleClassifyProductsClientSide = () => {
    setIsProcessing(true);
    const results = catalog.map((item) => {
      let matchedIkpu = null;
      for (const rule of TASNIF_RULES) {
        if (rule.regex.test(item.name)) {
          matchedIkpu = rule.ikpu;
          break;
        }
      }
      return {
        ...item,
        classifiedIkpu: matchedIkpu || 'DEFAULT_IKPU',
      };
    });

    setClassifiedResults(results);
    setIsProcessing(false);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-bold mb-2">Tasnif Avto-Klassifikator (Frontend Tasnif)</h3>
      <button
        onClick={handleClassifyProductsClientSide}
        disabled={isProcessing}
        className="px-4 py-2 bg-emerald-600 text-white rounded min-h-[44px]"
      >
        {isProcessing ? 'Tasniflanmoqda...' : '2,000 ta tovarlarni tasniflash'}
      </button>

      <div className="mt-4 text-sm">
        Tasniflangan: {classifiedResults.length} ta mahsulot
      </div>
    </div>
  );
}
