import { Plus } from 'lucide-react';

export default function StockDocumentAddLineButton({ label, onClick }) {
  return (
    <button type="button" className="rst-stock-doc__add" onClick={onClick}>
      <Plus size={14} aria-hidden />
      {label}
    </button>
  );
}
