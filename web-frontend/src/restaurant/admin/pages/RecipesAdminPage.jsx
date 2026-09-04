import { Link } from 'react-router-dom';
import { BaseButton, BaseInput } from '../../../components/ui';
import { useRecipesAdminPage } from '../hooks/useRecipesAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';
import '../styles/tech-card.css';

export default function RecipesAdminPage() {
  const p = useRecipesAdminPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  const selectedDish = p.dishes.find((dish) => dish.id === p.selectedId);
  const stockProductsPath = '/rst/admin/stock/products';

  return (
    <section className="rst-tech">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.recipesTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.recipesSubtitle')}</p>
        </div>
        <BaseButton type="button" onClick={() => p.setWizardOpen(true)}>
          {p.t('rst.admin.recipeWizardOpen')}
        </BaseButton>
      </div>

      {p.workspace.canPickStore ? (
        <label className="rst-admin-field rst-admin-field--full mb-3">
          <span className="rst-admin-field__label">{p.t('rst.admin.selectStore')}</span>
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

      {p.wizardOpen ? (
        <div className="rst-admin-form">
          <div>
            <h2 className="rst-coming__title mb-1">{p.t('rst.admin.recipeWizardTitle')}</h2>
            <p className="rst-coming__text mb-0">{p.t('rst.admin.recipeWizardHint')}</p>
          </div>

          <div className="rst-admin-form__grid rst-admin-form__grid--recipe">
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.admin.dishName')}</span>
              <BaseInput
                value={p.wizard.name}
                onChange={(e) => p.setWizard({ ...p.wizard, name: e.target.value })}
              />
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.admin.price')}</span>
              <BaseInput
                type="number"
                min="0"
                step="0.01"
                value={p.wizard.price}
                onChange={(e) => p.setWizard({ ...p.wizard, price: e.target.value })}
              />
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.admin.dishCategory')}</span>
              <BaseInput
                value={p.wizard.category}
                placeholder={p.t('rst.admin.dishCategoryHint')}
                onChange={(e) => p.setWizard({ ...p.wizard, category: e.target.value })}
              />
            </label>
            <div className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.admin.dishImage')}</span>
              <label className="rst-file">
                <input
                  className="rst-file__input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => p.onWizardImage(e.target.files?.[0])}
                />
                <span className="rst-file__btn">{p.t('rst.admin.chooseFile')}</span>
                <span className="rst-file__name">
                  {p.wizard.imageName || p.t('rst.admin.noFileSelected')}
                </span>
              </label>
              {p.wizard.imageUrl ? (
                <div className="rst-file__preview-wrap">
                  <img src={p.wizard.imageUrl} alt="" className="rst-file__preview" />
                  <BaseButton
                    type="button"
                    variant="ghost"
                    onClick={() => p.setWizard({ ...p.wizard, imageUrl: '', imageName: '' })}
                  >
                    {p.t('rst.admin.clearImage')}
                  </BaseButton>
                </div>
              ) : null}
            </div>
          </div>

          <p className="rst-admin-form__note mb-0">
            {p.t('rst.admin.recipeWizardIngredients')}
            {' · '}
            <Link to={stockProductsPath}>{p.t('rst.admin.toStockProducts')}</Link>
          </p>
        </div>
      ) : null}

      <div className="rst-tech__split">
        <aside className="rst-tech__dishes">
          {p.dishes.length === 0 ? (
            <div className="rst-empty">{p.t('rst.admin.recipeNoDishes')}</div>
          ) : null}
          {p.dishes.map((dish) => {
            const hasRecipe = p.recipes.some((recipe) => recipe.menuItemId === dish.id);
            return (
              <button
                key={dish.id}
                type="button"
                className={`rst-tech__dish${p.selectedId === dish.id ? ' is-active' : ''}`}
                onClick={() => p.setSelectedId(dish.id)}
              >
                <div className="rst-tech__dish-media">
                  {dish.imageUrl ? (
                    <img src={dish.imageUrl} alt="" />
                  ) : (
                    <div className="rst-tech__dish-media-empty">{p.t('rst.admin.noPhoto')}</div>
                  )}
                </div>
                <div className="rst-tech__dish-body">
                  <strong>{dish.name}</strong>
                  <span>
                    {dish.category ? `${dish.category} · ` : ''}
                    {hasRecipe ? p.t('rst.admin.recipeReady') : p.t('rst.admin.recipeEmpty')}
                  </span>
                </div>
              </button>
            );
          })}
        </aside>

        <div className="rst-tech__card">
          {!selectedDish && !p.wizardOpen ? (
            <div className="rst-empty">{p.t('rst.admin.recipePickDish')}</div>
          ) : (
            <>
              <header className="rst-tech__head">
                <div>
                  <h2 className="rst-coming__title">
                    {p.wizardOpen ? p.t('rst.admin.recipeWizardIngredients') : selectedDish?.name}
                  </h2>
                  <p className="rst-coming__text mb-0">{p.t('rst.admin.recipeOutput')}</p>
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

              <div className="rst-tech__table-wrap">
                <table className="rst-tech__table">
                  <thead>
                    <tr>
                      <th>{p.t('rst.admin.ingredient')}</th>
                      <th>{p.t('rst.admin.qtyGross')}</th>
                      <th>{p.t('rst.admin.wastePercent')}</th>
                      <th>{p.t('rst.admin.qtyNet')}</th>
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
                                <span className="rst-tech__suggest-empty">
                                  {p.t('rst.admin.ingredientEmpty')}
                                  {' '}
                                  <Link to={stockProductsPath}>{p.t('rst.admin.toStockProducts')}</Link>
                                </span>
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
                        <td>
                          <BaseInput
                            value={line.unit}
                            onChange={(e) => p.setLines((current) => current.map((row, i) => (
                              i === index ? { ...row, unit: e.target.value } : row
                            )))}
                          />
                        </td>
                        <td>
                          <BaseButton type="button" variant="ghost" size="sm" onClick={() => p.removeLine(index)}>
                            ×
                          </BaseButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rst-tech__actions">
                <BaseButton type="button" variant="ghost" onClick={p.addLine}>
                  {p.t('rst.admin.addIngredient')}
                </BaseButton>
                <div className="rst-tech__actions-main">
                  {p.wizardOpen ? (
                    <>
                      <BaseButton type="button" variant="ghost" onClick={() => p.setWizardOpen(false)}>
                        {p.t('common.cancel')}
                      </BaseButton>
                      <BaseButton
                        type="button"
                        onClick={() => p.wizardMutation.mutate()}
                        disabled={p.wizardMutation.isPending}
                      >
                        {p.t('rst.admin.recipeWizardSave')}
                      </BaseButton>
                    </>
                  ) : (
                    <BaseButton
                      type="button"
                      onClick={() => p.saveMutation.mutate()}
                      disabled={p.saveMutation.isPending || !selectedDish}
                    >
                      {p.t('common.save')}
                    </BaseButton>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
