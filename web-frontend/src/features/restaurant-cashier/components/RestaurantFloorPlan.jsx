import FloorPlanPreview from '../../restaurant-hall/components/FloorPlanPreview';

export default function RestaurantFloorPlan({ hall, onTableClick, selectedTableId, t }) {
  return (
    <div className="restaurant-cashier-floor">
      <FloorPlanPreview
        hall={hall}
        onTableClick={onTableClick}
        showStatus
        showCheckPreview
        selectedTableId={selectedTableId}
        t={t}
      />
    </div>
  );
}
