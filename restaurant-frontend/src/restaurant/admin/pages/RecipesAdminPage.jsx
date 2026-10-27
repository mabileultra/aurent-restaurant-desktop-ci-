import { Link } from 'react-router-dom';
import { BaseButton, BaseInput } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import RstMenuImage from '../../shared/components/RstMenuImage';
import { useMenuPhotos } from '../../shared/hooks/useMenuPhotos';
import MenuDishFilters from '../components/MenuDishFilters';
import RecipeFoodCostSummary from '../components/RecipeFoodCostSummary';
import RecipeWizardModal from '../components/RecipeWizardModal';
import { useRecipesAdminPage } from '../hooks/useRecipesAdminPage';
import { formatFoodCostPercent, formatUnitCost, lineIngredientCost } from '../utils/recipeFoodCost';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';
import '../styles/menu-admin.css';
import '../styles/tech-card.css';

export default function RecipesAdminPage() {
  const p = useRecipesAdminPage();
  const photos = useMenuPhotos(p.workspace.storeId);

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  const selectedDish = p.selectedDish;
  const stockProductsPath = '/rst/admin/stock/products?create=1';

  return (
    <section className="rst-tech">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.recipesTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.recipesSubtitle')}</p>
        </div>
        <div className="rst-halls__actions">
          <BaseButton type="button" size="sm" onClick={p.openWizard}>
            {p.t('rst.admin.recipeWizardOpen')}
          </BaseButton>
        </div>
      </div>

      <MenuDishFilters p={p} />

      <div className="rst-tech__split">
        <div className="rst-tech__dishes-panel">
          <aside className="rst-tech__dishes">
            {p.dishTotal === 0 ? (
              <div className="rst-empty">{p.t('rst.admin.recipeNoDishes')}</div>
            ) : null}
            {p.dishes.map((dish) => {
              const hasRecipe = p.recipes.some((recipe) => recipe.menuItemId === dish.id);
              const dishFc = p.dishFoodCostById[dish.id];
              return (
                <button
                  key={dish.id}
                  type="button"
                  className={`rst-tech__dish${p.selectedId === dish.id ? ' is-active' : ''}`}
                  onClick={() => p.setSelectedId(dish.id)}
                >
                  {photos.enabled ? (
                    <div className="rst-tech__dish-media">
                      {dish.imageUrl ? (
                        <RstMenuImage imageUrl={dish.imageUrl} />
                      ) : (
                        <div className="rst-tech__dish-media-empty">{p.t('rst.admin.noPhoto')}</div>
                      )}
                    </div>
                  ) : null}
                  <div className="rst-tech__dish-body">
                    <strong>{dish.name}</strong>
                    <span>
                      {dish.category ? `${dish.category} · ` : ''}
                      {hasRecipe ? p.t('rst.admin.recipeReady') : p.t('rst.admin.recipeEmpty')}
                      {hasRecipe && dishFc?.pricedLines > 0
                        ? ` · ${formatFoodCostPercent(dishFc.percent)}`
                        : ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </aside>
          {p.dishTotal > 0 ? (
            <TablePagination
              className="rst-tech__dishes-pagination"
              page={p.dishPage}
              pageSize={p.dishPageSize}
              total={p.dishTotal}
              totalPages={p.dishTotalPages}
              pageSizeOptions={p.dishPageSizeOptions}
              onPageChange={p.setDishPage}
              onPageSizeChange={p.setDishPageSize}
            />
          ) : null}
        </div>

        <div className="rst-tech__card">
          {!selectedDish ? (
            <div className="rst-empty">{p.t('rst.admin.recipePickDish')}</div>
          ) : (
            <>
              <header className="rst-tech__head">
                <div>
                  <h2 className="rst-coming__title">{selectedDish.name}</h2>
                  <p className="rst-coming__text mb-0">
                    {p.t('rst.admin.recipeOutput')}
                    {' · '}
                    {p.t('rst.admin.price')}: {fmtMoneyCompact(selectedDish.price)}
                  </p>
                </div>
                <label className="rst-admin-field rst-tech__output">
                  <span className="rst-admin-field__label">{p.t('rst.admin.outputQty')}</span>
                  <BaseInput
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={p.outputQty}
                    onChange={(e) => p.setOutputQty(e.target.value)}
                  />
                </label>
              </header>

              <RecipeFoodCostSummary t={p.t} foodCost={p.foodCost} />

              <div className="rst-tech__table-wrap">
                <table className="rst-tech__table">
                  <thead>
                    <tr>
                      <th>{p.t('rst.admin.ingredient')}</th>
                      <th>{p.t('rst.admin.qtyGross')}</th>
                      <th>{p.t('rst.admin.unit')}</th>
                      <th>{p.t('rst.admin.wastePercent')}</th>
                      <th>{p.t('rst.admin.qtyNet')}</th>
                      <th>{p.t('rst.admin.unitCost')}</th>
                      <th>{p.t('rst.admin.lineCost')}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {p.pagedLines.map(({ line, index }) => {
                      const unitCost = line.costPrice != null
                        ? line.costPrice
                        : (line.productId ? p.costByProductId[String(line.productId)] : null);
                      const lineCost = lineIngredientCost(line, unitCost);
                      return (
                        <tr key={`${line.productId || 'new'}-${index}`}>
                          <td>
                            <BaseInput
                              value={line.productName}
                              placeholder={p.t('rst.admin.ingredientSearch')}
                              onFocus={() => p.setActiveLineIndex(index)}
                              onChange={(e) => {
                                p.setActiveLineIndex(index);
                                p.setSearch(e.target.value);
                                p.setLines((current) => current.map((row, i) => (
                                  i === index
                                    ? {
                                      ...row,
                                      productName: e.target.value,
                                      productId: '',
                                      costPrice: null,
                                    }
                                    : row
                                )));
                              }}
                            />
                            {p.activeLineIndex === index && p.search.trim().length > 0 ? (
                              <div className="rst-tech__suggest">
                                {p.products.length === 0 ? (
                                  <span className="rst-tech__suggest-empty">
                                    {p.t('rst.admin.ingredientEmpty')}
                                    {' '}
                                    <Link to={stockProductsPath}>{p.t('rst.admin.toStockProducts')}</Link>
                                  </span>
                                ) : p.products.map((product) => (
                                  <button key={product.id} type="button" onClick={() => p.pickProduct(index, product)}>
                                    {product.name}
                                    {product.sku ? ` · ${product.sku}` : ''}
                                    {product.costPrice != null
                                      ? ` · ${fmtMoneyCompact(product.costPrice)}`
                                      : ''}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </td>
                          <td>
                            <BaseInput
                              type="number"
                              min="0.001"
                              step="0.001"
                              value={line.qtyGross}
                              onChange={(e) => p.setLines((current) => current.map((row, i) => (
                                i === index ? { ...row, qtyGross: e.target.value } : row
                              )))}
                            />
                          </td>
                          <td className="rst-tech__unit">{line.unit || '—'}</td>
                          <td>
                            <BaseInput
                              type="number"
                              min="0"
                              step="0.1"
                              value={line.wastePercent}
                              onChange={(e) => p.setLines((current) => current.map((row, i) => (
                                i === index ? { ...row, wastePercent: e.target.value } : row
                              )))}
                            />
                          </td>
                          <td className="rst-tech__net">{p.qtyNetOf(line).toFixed(3)}</td>
                          <td className="rst-tech__net">{formatUnitCost(unitCost, line.unit)}</td>
                          <td className="rst-tech__net">
                            {lineCost != null ? fmtMoneyCompact(lineCost) : '—'}
                          </td>
                          <td>
                            <BaseButton type="button" variant="ghost" size="sm" onClick={() => p.removeLine(index)}>
                              ×
                            </BaseButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {p.lineTotal > 0 ? (
                <TablePagination
                  className="rst-tech__lines-pagination"
                  page={p.linePage}
                  pageSize={p.linePageSize}
                  total={p.lineTotal}
                  totalPages={p.lineTotalPages}
                  pageSizeOptions={p.linePageSizeOptions}
                  onPageChange={p.setLinePage}
                  onPageSizeChange={p.setLinePageSize}
                />
              ) : null}

              <div className="rst-tech__actions">
                <BaseButton type="button" variant="ghost" onClick={p.addLine}>
                  {p.t('rst.admin.addIngredient')}
                </BaseButton>
                <div className="rst-tech__actions-main">
                  <BaseButton
                    type="button"
                    onClick={() => p.saveMutation.mutate()}
                    disabled={p.saveMutation.isPending || !selectedDish}
                  >
                    {p.t('common.save')}
                  </BaseButton>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <RecipeWizardModal p={p} photosEnabled={photos.enabled} />
    </section>
  );
}
