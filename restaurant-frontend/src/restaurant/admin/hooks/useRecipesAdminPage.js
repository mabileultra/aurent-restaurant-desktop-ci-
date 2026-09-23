import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../../../api/product.api';
import { rstMenuApi } from '../../api/menu.api';
import { rstRecipeApi } from '../../api/recipe.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { readImageDataUrl } from '../../../utils/readImageDataUrl';
import { toastApiError } from '../../../utils/apiError';
import { computeRecipeFoodCost } from '../utils/recipeFoodCost';

const emptyLine = () => ({
  productId: '',
  productName: '',
  unit: 'kg',
  qtyGross: '0.1',
  wastePercent: '0',
  costPrice: null,
});

function qtyNetOf(line) {
  const gross = Number(line.qtyGross) || 0;
  const waste = Number(line.wastePercent) || 0;
  return Math.max(0, gross * (1 - waste / 100));
}

function collectProductIds(recipes, lines) {
  const ids = new Set();
  for (const recipe of recipes ?? []) {
    for (const line of recipe.lines ?? []) {
      if (line.productId) ids.add(String(line.productId));
    }
  }
  for (const line of lines ?? []) {
    if (line.productId) ids.add(String(line.productId));
  }
  return [...ids].sort();
}

export function useRecipesAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [selectedId, setSelectedId] = useState(null);
  const [outputQty, setOutputQty] = useState('1');
  const [lines, setLines] = useState([emptyLine()]);
  const [search, setSearch] = useState('');
  const [activeLineIndex, setActiveLineIndex] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardPrevSelectedId, setWizardPrevSelectedId] = useState(null);
  const [wizard, setWizard] = useState({
    name: '',
    price: '',
    category: '',
    imageUrl: '',
    imageName: '',
  });
  const [searchParams, setSearchParams] = useSearchParams();

  const dishesQuery = useQuery({
    queryKey: ['rst-menu-admin', workspace.storeId],
    queryFn: () => rstMenuApi.list(workspace.storeId, false).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  useEffect(() => {
    const dishParam = searchParams.get('dish');
    if (!dishParam) return;
    const dishId = Number(dishParam);
    if (!Number.isFinite(dishId)) return;
    const dishes = dishesQuery.data ?? [];
    if (dishes.length === 0) return;
    if (dishes.some((dish) => Number(dish.id) === dishId)) {
      setSelectedId(dishId);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('dish');
    setSearchParams(next, { replace: true });
  }, [dishesQuery.data, searchParams, setSearchParams]);

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

  const costProductIds = useMemo(
    () => collectProductIds(recipesQuery.data, lines),
    [recipesQuery.data, lines]
  );

  const costsQuery = useQuery({
    queryKey: ['rst-recipe-ingredient-costs', workspace.storeId, costProductIds.join(',')],
    queryFn: async () => {
      const entries = await Promise.all(costProductIds.map(async (id) => {
        try {
          const res = await productApi.getById(id, { storeId: workspace.storeId });
          const cost = Number(res.data?.costPrice);
          return [id, Number.isFinite(cost) && cost >= 0 ? cost : null];
        } catch {
          return [id, null];
        }
      }));
      return Object.fromEntries(entries);
    },
    enabled: workspace.storeId != null && costProductIds.length > 0,
    staleTime: 60_000,
  });

  const costByProductId = costsQuery.data ?? {};

  useEffect(() => {
    if (!selectedRecipe) {
      setOutputQty('1');
      setLines([emptyLine()]);
      return;
    }
    setOutputQty(String(selectedRecipe.outputQty ?? '1'));
    setLines((selectedRecipe.lines ?? []).map((line) => {
      const id = String(line.productId);
      const fromCache = costByProductId[id];
      return {
        productId: line.productId,
        productName: line.productName,
        unit: line.unit,
        qtyGross: String(line.qtyGross),
        wastePercent: String(line.wastePercent),
        costPrice: fromCache != null ? fromCache : null,
      };
    }));
  }, [selectedRecipe]);

  useEffect(() => {
    if (!costsQuery.data) return;
    setLines((current) => current.map((line) => {
      if (!line.productId) return line;
      const cached = costsQuery.data[String(line.productId)];
      if (cached == null || line.costPrice === cached) return line;
      return { ...line, costPrice: cached };
    }));
  }, [costsQuery.data]);

  const buildRecipeBody = () => {
    const validLines = lines
      .filter((line) => line.productId && Number(line.qtyGross) > 0)
      .map((line) => ({
        productId: line.productId,
        productName: line.productName,
        unit: line.unit || 'kg',
        qtyGross: Number(line.qtyGross),
        wastePercent: Number(line.wastePercent) || 0,
      }));
    if (validLines.length === 0) {
      throw new Error('NO_INGREDIENTS');
    }
    return {
      outputQty: Number(outputQty) || 1,
      lines: validLines,
    };
  };

  const saveMutation = useMutation({
    mutationFn: () => rstRecipeApi.save(selectedId, buildRecipeBody()),
    onSuccess: () => {
      toast.success(t('rst.admin.recipeSaved'));
      qc.invalidateQueries({ queryKey: ['rst-recipes', workspace.storeId] });
    },
    onError: (err) => {
      if (err?.message === 'NO_INGREDIENTS') {
        toast.error(t('rst.admin.recipeNeedIngredient'));
        return;
      }
      toastApiError(err, t('rst.admin.saveFailed'));
    },
  });

  const wizardMutation = useMutation({
    mutationFn: async () => {
      if (!wizard.name.trim() || Number(wizard.price) < 0) {
        throw new Error('WIZARD_INVALID');
      }
      const created = await rstMenuApi.create(workspace.storeId, {
        name: wizard.name.trim(),
        price: Number(wizard.price) || 0,
        available: true,
        sortOrder: 100,
        itemType: 'DISH',
        category: wizard.category.trim() || null,
        imageUrl: wizard.imageUrl || null,
        modifierGroupIds: [],
      }).then((r) => r.data);
      const recipeBody = buildRecipeBody();
      await rstRecipeApi.save(created.id, recipeBody);
      return created;
    },
    onSuccess: (created) => {
      toast.success(t('rst.admin.recipeWizardSaved'));
      setWizardOpen(false);
      setWizardPrevSelectedId(null);
      setWizard({ name: '', price: '', category: '', imageUrl: '', imageName: '' });
      setSearch('');
      setActiveLineIndex(null);
      qc.invalidateQueries({ queryKey: ['rst-menu-admin', workspace.storeId] });
      qc.invalidateQueries({ queryKey: ['rst-menu-pos', workspace.storeId] });
      qc.invalidateQueries({ queryKey: ['rst-recipes', workspace.storeId] });
      setSelectedId(created.id);
    },
    onError: (err) => {
      if (err?.message === 'NO_INGREDIENTS') {
        toast.error(t('rst.admin.recipeNeedIngredient'));
        return;
      }
      if (err?.message === 'WIZARD_INVALID') {
        toast.error(t('rst.admin.recipeWizardInvalid'));
        return;
      }
      toastApiError(err, t('rst.admin.saveFailed'));
    },
  });

  const pickProduct = (index, product) => {
    const unit = typeof product.unitCode === 'object'
      ? (product.unitCode?.displayLabel || product.unitCode?.code || 'kg')
      : (product.unitCode || 'kg');
    const cost = Number(product.costPrice);
    setLines((current) => current.map((line, i) => (
      i === index
        ? {
          ...line,
          productId: product.id,
          productName: product.name,
          unit,
          costPrice: Number.isFinite(cost) && cost >= 0 ? cost : null,
        }
        : line
    )));
    setSearch('');
    setActiveLineIndex(null);
  };

  const selectedDish = useMemo(
    () => (dishesQuery.data ?? []).find((dish) => dish.id === selectedId) ?? null,
    [dishesQuery.data, selectedId]
  );

  const sellPriceForFoodCost = wizardOpen
    ? wizard.price
    : (selectedDish?.price ?? 0);

  const foodCost = useMemo(
    () => computeRecipeFoodCost({
      lines,
      costByProductId,
      outputQty,
      sellPrice: sellPriceForFoodCost,
    }),
    [lines, costByProductId, outputQty, sellPriceForFoodCost]
  );

  const dishFoodCostById = useMemo(() => {
    const map = {};
    const dishes = dishesQuery.data ?? [];
    const recipes = recipesQuery.data ?? [];
    for (const dish of dishes) {
      const recipe = recipes.find((row) => row.menuItemId === dish.id);
      if (!recipe) continue;
      map[dish.id] = computeRecipeFoodCost({
        lines: recipe.lines ?? [],
        costByProductId,
        outputQty: recipe.outputQty,
        sellPrice: dish.price,
      });
    }
    return map;
  }, [dishesQuery.data, recipesQuery.data, costByProductId]);

  const onWizardImage = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await readImageDataUrl(file, 400 * 1024);
      setWizard((current) => ({ ...current, imageUrl: dataUrl, imageName: file.name }));
    } catch {
      toast.error(t('rst.admin.imageUploadFailed'));
    }
  };

  const openWizard = () => {
    setWizardPrevSelectedId(selectedId);
    setSelectedId(null);
    setWizard({ name: '', price: '', category: '', imageUrl: '', imageName: '' });
    setOutputQty('1');
    setLines([emptyLine()]);
    setSearch('');
    setActiveLineIndex(null);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setWizard({ name: '', price: '', category: '', imageUrl: '', imageName: '' });
    setSearch('');
    setActiveLineIndex(null);
    setSelectedId(wizardPrevSelectedId);
    setWizardPrevSelectedId(null);
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
    qtyNetOf,
    foodCost,
    dishFoodCostById,
    costByProductId,
    wizardOpen,
    openWizard,
    closeWizard,
    wizard,
    setWizard,
    wizardMutation,
    onWizardImage,
    addLine: () => setLines((current) => [...current, emptyLine()]),
    removeLine: (index) => {
      setLines((current) => current.filter((_, i) => i !== index));
      setActiveLineIndex(null);
    },
  };
}
