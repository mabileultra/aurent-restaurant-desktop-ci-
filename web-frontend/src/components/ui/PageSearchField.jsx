import { Search } from 'lucide-react';
import clsx from 'clsx';
import { inputCls } from './uiClasses';
import '../../styles/shared/page-search-field.css';

export default function PageSearchField({
  value,
  onChange,
  placeholder,
  className,
}) {
  return (
    <div className={clsx('page-search-field', className)}>
      <Search size={16} className="page-search-field__icon" aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(inputCls, 'page-search-field__input')}
      />
    </div>
  );
}
