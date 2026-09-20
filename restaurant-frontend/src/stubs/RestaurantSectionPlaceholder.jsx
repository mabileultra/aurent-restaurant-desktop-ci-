import { EmptyState } from '../components/ui';
import '../styles/stubs/restaurant-section-placeholder.css';

/**
 * Local stub until the restaurant owns this screen.
 * No links to main web-frontend.
 */
export default function RestaurantSectionPlaceholder({ title, hint }) {
  return (
    <div className="rst-section-placeholder">
      <EmptyState
        title={title}
        text={hint || 'Раздел будет в ресторанном приложении. Основной фронт не используем.'}
      />
    </div>
  );
}
