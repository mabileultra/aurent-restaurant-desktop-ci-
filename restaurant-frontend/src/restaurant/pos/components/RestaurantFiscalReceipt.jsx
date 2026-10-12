import { useEffect, useState } from 'react';
import { FiscalReceiptBody } from '../../../components/receipt';
import { guestBillScreenHeader } from '../../shared/printProfile/applyPrintProfile';
import { loadStorePrintProfile } from '../../shared/printProfile/loadStorePrintProfile';

/** On-screen fiscal check uses the restaurant printer header, not only tenant receipt fields. */
export default function RestaurantFiscalReceipt({ sale, printAreaId, className }) {
  const storeId = sale?.storeId;
  const [header, setHeader] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadStorePrintProfile(storeId).then((profile) => {
      if (!cancelled) setHeader(guestBillScreenHeader(profile));
    });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  return (
    <FiscalReceiptBody
      sale={sale}
      header={header}
      printAreaId={printAreaId}
      className={className}
    />
  );
}
