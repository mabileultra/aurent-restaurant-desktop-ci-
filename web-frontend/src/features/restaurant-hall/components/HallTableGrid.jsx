import { Plus } from 'lucide-react';
import HallTableCard from './HallTableCard';
import '../styles/hall-table-grid.css';

export default function HallTableGrid({ tables, onTableClick, onAddTable, t }) {
  return (
    <div className="hall-table-grid">
      {tables.map((table) => (
        <HallTableCard key={table.id} table={table} onClick={onTableClick} t={t} />
      ))}
      <button type="button" className="hall-table-grid__add" onClick={onAddTable}>
        <Plus size={28} strokeWidth={1.75} />
        <span>{t('restaurantHall.addTable')}</span>
      </button>
    </div>
  );
}
