import '../../styles/shared/shell-page-skeleton.css';

/** Контент-скелетон внутри уже открытого admin/platform shell. */
export default function ShellPageSkeleton() {
  return (
    <div className="shell-page-skeleton" aria-busy="true" aria-label="Loading">
      <div className="shell-page-skeleton__title" />
      <div className="shell-page-skeleton__row shell-page-skeleton__row--wide" />
      <div className="shell-page-skeleton__row" />
      <div className="shell-page-skeleton__row" />
      <div className="shell-page-skeleton__row" />
    </div>
  );
}
