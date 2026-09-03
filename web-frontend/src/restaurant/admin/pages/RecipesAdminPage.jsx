import { BaseButton, BaseInput } from '../../../components/ui';
import { useRecipesAdminPage } from '../hooks/useRecipesAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/tech-card.css';

export default function RecipesAdminPage() {
  const p = useRecipesAdminPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  const selectedDish = p.dishes.find((dish) => dish.id === p.selectedId);

  return (
    <section className="rst-tech">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.recipesTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.recipesSubtitle')}</p>
        </div>
      </div>

      {p.workspace.canPickStore ? (
        <label className="rst-shell__store d-block mb-3">
          <span className="d-block mb-1 small">{p.t('rst.admin.selectStore')}</span>
          <select
            className="form-select"
            value={p.workspace.pickedStoreId}
            onChange={(e) => p.workspace.setPickedStoreId(e.target.value)}
          >
            <option value="">{p.t('rst.admin.selectStore')}</option>
            {p.workspace.restaurantStores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="rst-tech__split">
        <aside className="rst-tech__dishes">
          {p.dishes.map((dish) => {
            const hasRecipe = p.recipes.some((recipe) => recipe.menuItemId === dish.id);
            return (
              <button
                key={dish.id}
                type="button"
                className={`rst-tech__dish${p.selectedId === dish.id ? ' is-active' : ''}`}
                onClick={() => p.setSelectedId(dish.id)}
              >
                <strong>{dish.name}</strong>
                <span>{hasRecipe ? p.t('rst.admin.recipeReady') : p.t('rst.admin.recipeEmpty')}</span>
              </button>
            );
          })}
        </aside>
        <div className="rst-tech__card">
          {!selectedDish ? (
            <div className="rst-empty">{p.t('rst.admin.recipePickDish')}</div>
          ) : (
            <>
              <header className="rst-tech__head">
                <div>
                  <h2 className="rst-coming__title">{selectedDish.name}</h2>
                  <p className="rst-coming__text mb-0">{p.t('rst.admin.recipeOutput')}</p>
                </div>
                <label>
                  <span className="small d-block mb-1">{p.t('rst.admin.outputQty')}</span>
                  <BaseInput type="number" min="0.001" step="0.001" value={p.outputQty} onChange={(e) => p.setOutputQty(e.target.value)} />
                </label>
              </header>
              <table className="rst-tech__table">
                <thead>
                  <tr>
                    <th>{p.t('rst.admin.ingredient')}</th>
                    <th>{p.t('rst.admin.qtyGross')}</th>
                    <th>{p.t('rst.admin.wastePercent')}</th>
                    <th>{p.t('rst.admin.unit')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {p.lines.map((line, index) => (
                    <tr key={`${line.productId}-${index}`}>
                      <td>
                        <BaseInput
                          value={line.productName}
                          placeholder={p.t('rst.admin.ingredientSearch')}
                          onFocus={() => p.setActiveLineIndex(index)}
                          onChange={(e) => {
                            p.setActiveLineIndex(index);
                            p.setSearch(e.target.value);
                            p.setLines((current) => current.map((row, i) => (
                              i === index ? { ...row, productName: e.target.value, productId: '' } : row
                            )));
                          }}
                        />
                        {p.activeLineIndex === index && p.search.trim().length > 0 ? (
                          <div className="rst-tech__suggest">
                            {p.products.length === 0 ? (
                              <span className="rst-tech__suggest-empty">{p.t('rst.admin.ingredientEmpty')}</span>
                            ) : p.products.map((product) => (
                              <button key={product.id} type="button" onClick={() => p.pickProduct(index, product)}>
                                {product.name}
                                {product.sku ? ` · ${product.sku}` : ''}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <BaseInput type="number" min="0.001" step="0.001" value={line.qtyGross} onChange={(e) => p.setLines((current) => current.map((row, i) => (i === index ? { ...row, qtyGross: e.target.value } : row)))} />
                      </td>
                      <td>
                        <BaseInput type="number" min="0" step="0.1" value={line.wastePercent} onChange={(e) => p.setLines((current) => current.map((row, i) => (i === index ? { ...row, wastePercent: e.target.value } : row)))} />
                      </td>
                      <td>
                        <BaseInput value={line.unit} onChange={(e) => p.setLines((current) => current.map((row, i) => (i === index ? { ...row, unit: e.target.value } : row)))} />
                      </td>
                      <td>
                        <BaseButton type="button" variant="ghost" size="sm" onClick={() => p.removeLine(index)}>×</BaseButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="rst-tech__actions">
                <BaseButton type="button" variant="ghost" onClick={p.addLine}>{p.t('rst.admin.addIngredient')}</BaseButton>
                <BaseButton type="button" onClick={() => p.saveMutation.mutate()} disabled={p.saveMutation.isPending}>
                  {p.t('common.save')}
                </BaseButton>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
