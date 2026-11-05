import { usePharmacyWeightEntryModal } from '../hooks/usePharmacyWeightEntryModal';
import WeightEntryModalBody from '../../cashier/components/weight-entry/WeightEntryModalBody';
import '../../../styles/shared/weight-entry-modal.css';
import '../styles/pharmacy-modal-shell.css';
import '../styles/pharmacy-weight-modal.css';

/** Pharmacy measured-qty modal — no scales hardware / PLU sync. */
export default function PharmacyWeightEntryModal(props) {
  const w = usePharmacyWeightEntryModal(props);
  if (!w.open || !w.product) return null;
  return <WeightEntryModalBody w={w} className="pharmacy-modal" />;
}
