import { Plus } from 'lucide-react';

export default function StockDocumentAddLineButton({ label, onClick, iconSize = 16 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="admin-link inline-flex items-center gap-1 text-sm"
    >
      <Plus size={iconSize} className="admin-icon" aria-hidden /> {label}
    </button>
  );
}
