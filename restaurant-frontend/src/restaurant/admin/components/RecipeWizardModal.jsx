import { Link } from 'react-router-dom';
import { BaseButton, BaseInput } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import RstModal from '../../shared/components/RstModal';
import { lineIngredientCost } from '../utils/recipeFoodCost';
import RecipeFoodCostSummary from './RecipeFoodCostSummary';

export default function RecipeWizardModal({ p }) {
  const stockProductsPath = '/rst/admin/stock/products?create=1';

  const close = () => p.closeWizard();

  return (
    <RstModal
      open={p.wizardOpen}
      title={p.t('rst.admin.recipeWizardTitle')}
      onClose={close}
      onSubmit={() => p.wizardMutation.mutate()}
      isPending={p.wizardMutation.isPending}
      asForm
      size="xl"
      cancelLabel={p.t('common.cancel')}
      submitLabel={p.t('rst.admin.recipeWizardSave')}
    >
      <p className="rst-coming__text mb-0">{p.t('rst.admin.recipeWizardHint')}</p>

      <div className="rst-modal-form__grid rst-tech-wizard__dish">
        <BaseInput
          label={p.t('rst.admin.dishName')}
          required
          value={p.wizard.name}
          onChange={(e) => p.setWizard({ ...p.wizard, name: e.target.value })}
        />
        <BaseInput
          label={p.t('rst.admin.price')}
          type="number"
          min="0"
          step="0.01"
          required
          value={p.wizard.price}
          onChange={(e) => p.setWizard({ ...p.wizard, price: e.target.value })}
        />
        <BaseInput
          label={p.t('rst.admin.dishCategory')}
          value={p.wizard.category}
          placeholder={p.t('rst.admin.dishCategoryHint')}
          onChange={(e) => p.setWizard({ ...p.wizard, category: e.target.value })}
        />
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{p.t('rst.admin.outputQty')}</span>
          <BaseInput
            type="number"
            min="0.001"
            step="0.001"
            value={p.outputQty}
            onChange={(e) => p.setOutputQty(e.target.value)}
          />
        </label>
        <div className="rst-admin-field rst-modal-form__full">
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
                size="sm"
                onClick={() => p.setWizard({ ...p.wizard, imageUrl: '', imageName: '' })}
              >
                {p.t('rst.admin.clearImage')}
              </BaseButton>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rst-tech-wizard__ingredients">
        <div className="rst-tech-wizard__ingredients-head">
          <strong>{p.t('rst.admin.recipeWizardIngredients')}</strong>
          <p className="rst-coming__text mb-0">
            {p.t('rst.admin.recipeOutput')}
            {' · '}
            <Link to={stockProductsPath} onClick={close}>
              {p.t('rst.admin.toStockProducts')}
            </Link>
          </p>
        </div>

        <RecipeFoodCostSummary t={p.t} foodCost={p.foodCost} />

        <div className="rst-tech__table-wrap">
          <table className="rst-tech__table">
            <thead>
              <tr>
                <th>{p.t('rst.admin.ingredient')}</th>
                <th>{p.t('rst.admin.qtyGross')}</th>
                <th>{p.t('rst.admin.wastePercent')}</th>
                <th>{p.t('rst.admin.qtyNet')}</th>
                <th>{p.t('rst.admin.unit')}</th>
                <th>{p.t('rst.admin.lineCost')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {p.lines.map((line, index) => {
                const unitCost = line.costPrice != null
                  ? line.costPrice
                  : (line.productId ? p.costByProductId[String(line.productId)] : null);
                const lineCost = lineIngredientCost(line, unitCost);
                return (
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
                              <Link to={stockProductsPath} onClick={close}>
                                {p.t('rst.admin.toStockProducts')}
                              </Link>
                            </span>
                          ) : p.products.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => p.pickProduct(index, product)}
                            >
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
                    <td className="rst-tech__net">
                      {lineCost != null ? fmtMoneyCompact(lineCost) : '—'}
                    </td>
                    <td>
                      <BaseButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => p.removeLine(index)}
                      >
                        ×
                      </BaseButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rst-tech-wizard__add">
          <BaseButton type="button" variant="ghost" size="sm" onClick={p.addLine}>
            {p.t('rst.admin.addIngredient')}
          </BaseButton>
        </div>
      </div>
    </RstModal>
  );
}
