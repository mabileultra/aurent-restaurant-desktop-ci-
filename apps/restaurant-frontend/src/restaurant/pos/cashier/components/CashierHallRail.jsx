import FloorHallRail from '../../components/FloorHallRail';
import '../../styles/floor-hall-rail.css';

export default function CashierHallRail({
  halls = [],
  selectedHallId,
  onSelectHall,
  t,
}) {
  return (
    <FloorHallRail
      halls={halls}
      selectedHallId={selectedHallId}
      onSelectHall={onSelectHall}
      t={t}
    />
  );
}
