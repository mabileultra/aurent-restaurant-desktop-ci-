import { Search } from 'lucide-react';
import '../styles/delivery-search.css';

export default function DeliverySearchBar({ t, search, onSearchChange, onSearchApply }) {
  return (
    <div className="delivery-search">
      <div className="delivery-search__field">
        <Search size={18} className="delivery-search__icon" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearchApply();
            }
          }}
          placeholder={t('restaurantDelivery.searchPlaceholder')}
          className="delivery-search__input"
        />
      </div>
      <button type="button" className="delivery-search__btn" onClick={onSearchApply}>
        {t('common.search')}
      </button>
    </div>
  );
}
