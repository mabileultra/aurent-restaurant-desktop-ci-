import StockDocumentAddLineButton from './StockDocumentAddLineButton';

export default function StockDocumentLinesTable({
  title,
  lineCount,
  addLabel,
  onAddLine,
  columns,
  children,
}) {
  return (
    <section className="stock-doc-lines">
      <div className="stock-doc-lines__head">
        <h2 className="stock-doc-lines__title">
          {title}
          <span className="stock-doc-lines__count">{lineCount}</span>
        </h2>
        <StockDocumentAddLineButton label={addLabel} onClick={onAddLine} iconSize={14} />
      </div>
      <div className="stock-doc-lines__scroll">
        <table className="stock-doc-lines__table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className} style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </section>
  );
}
