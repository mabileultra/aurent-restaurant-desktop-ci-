import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../../api/product.api';
import { rstMenuApi } from '../../api/menu.api';
import { rstRecipeApi } from '../../api/recipe.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

const emptyLine = () => ({ productId: '', productName: '', unit: 'kg', qtyGross: '0.1', wastePercent: '0' });

export function useRecipesAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [selectedId, setSelectedId] = useState(null);
  const [outputQty, setOutputQty] = useState('1');
  const [lines, setLines] = useState([emptyLine()]);
  const [search, setSearch] = useState('');
  const [activeLineIndex, setActiveLineIndex] = useState(null);

  const dishesQuery = useQuery({
    queryKey: ['rst-menu-admin', workspace.storeId],
    queryFn: () => rstMenuApi.list(workspace.storeId, false).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const recipesQuery = useQuery({
    queryKey: ['rst-recipes', workspace.storeId],
    queryFn: () => rstRecipeApi.list(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const productsQuery = useQuery({
    queryKey: ['rst-stock-search', workspace.storeId, search],
    queryFn: () => productApi.getAll({
      storeId: workspace.storeId,
      search: search || undefined,
      activeOnly: true,
      size: 20,
    }).then((r) => r.data?.content ?? r.data ?? []),
    enabled: workspace.storeId != null,
  });

  const selectedRecipe = useMemo(
    () => (recipesQuery.data ?? []).find((recipe) => recipe.menuItemId === selectedId) ?? null,
    [recipesQuery.data, selectedId]
  );

  useEffect(() => {
    if (!selectedRecipe) {
      setOutputQty('1');
      setLines([emptyLine()]);
      return;
    }
    setOutputQty(String(selectedRecipe.outputQty ?? '1'));
    setLines((selectedRecipe.lines ?? []).map((line) => ({
      productId: line.productId,
      productName: line.productName,
      unit: line.unit,
      qtyGross: String(line.qtyGross),
      wastePercent: String(line.wastePercent),
    })));
  }, [selectedRecipe]);

  const saveMutation = useMutation({
    mutationFn: () => rstRecipeApi.save(selectedId, {
      outputQty: Number(outputQty) || 1,
      lines: lines
        .filter((line) => line.productId && Number(line.qtyGross) > 0)
        .map((line) => ({
          productId: line.productId,
          productName: line.productName,
          unit: line.unit || 'kg',
          qtyGross: Number(line.qtyGross),
          wastePercent: Number(line.wastePercent) || 0,
        })),
    }),
    onSuccess: () => {
      toast.success(t('rst.admin.recipeSaved'));
      qc.invalidateQueries({ queryKey: ['rst-recipes', workspace.storeId] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.saveFailed')),
  });

  const pickProduct = (index, product) => {
    const unit = typeof product.unitCode === 'object'
      ? (product.unitCode?.displayLabel || product.unitCode?.code || 'kg')
      : (product.unitCode || 'kg');
    setLines((current) => current.map((line, i) => (
      i === index
        ? {
          ...line,
          productId: product.id,
          productName: product.name,
          unit,
        }
        : line
    )));
    setSearch('');
    setActiveLineIndex(null);
  };

  return {
    t,
    workspace,
    dishes: (dishesQuery.data ?? []).filter((item) => item.active),
    recipes: recipesQuery.data ?? [],
    products: Array.isArray(productsQuery.data) ? productsQuery.data : [],
    selectedId,
    setSelectedId,
    outputQty,
    setOutputQty,
    lines,
    setLines,
    search,
    setSearch,
    activeLineIndex,
    setActiveLineIndex,
    saveMutation,
    pickProduct,
    addLine: () => setLines((current) => [...current, emptyLine()]),
    removeLine: (index) => {
      setLines((current) => current.filter((_, i) => i !== index));
      setActiveLineIndex(null);
    },
  };
}
