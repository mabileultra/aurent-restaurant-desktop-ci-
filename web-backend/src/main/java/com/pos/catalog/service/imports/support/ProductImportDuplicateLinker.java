package com.pos.catalog.service.imports.support;

import com.pos.catalog.dto.product.ProductImportConfirmRequest;
import com.pos.catalog.dto.product.ProductImportPreviewRow;
import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductStorePrice;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.product.support.ProductStorePriceApplier;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.exception.PosExceptions;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.repository.StoreRepository;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Повторный импорт (STATUS_DUPLICATE): не создаём карточку заново,
 * а привязываем существующую к филиалу (store_stock + цена при необходимости),
 * без затирания цен других магазинов и без перезаписи уже заданной цены филиала.
 */
@Component
@RequiredArgsConstructor
public class ProductImportDuplicateLinker {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final ProductStorePriceApplier storePriceApplier;
    private final StoreStockService storeStockService;
    private final TenantAccessSupport tenantAccess;

    /**
     * @return id карточки, если привязка выполнена
     */
    public UUID linkToAssortment(
        ProductImportPreviewRow row,
        ProductImportConfirmRequest.ImportRowConfirm rowOpts,
        Integer defaultStoreId
    ) {
        if (row == null || row.existingProductId() == null) {
            return null;
        }
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Product product = productRepository.findById(row.existingProductId())
            .orElseThrow(() -> PosExceptions.notFound("Product", row.existingProductId()));
        if (product.getCompany() == null || !companyId.equals(product.getCompany().getId())) {
            throw new BadRequestException("Товар принадлежит другой компании");
        }

        Integer storeId = resolveStoreId(rowOpts, defaultStoreId);
        List<Store> targets = resolveTargetStores(companyId, storeId);
        if (targets.isEmpty()) {
            throw new BadRequestException("Нет активных магазинов для привязки к кассе");
        }

        boolean priceForced = rowOpts != null
            && rowOpts.sellingPrice() != null
            && rowOpts.sellingPrice().compareTo(new BigDecimal("0.01")) >= 0;

        for (Store store : targets) {
            tenantAccess.assertCanAccessStore(store);
            BigDecimal existingStorePrice = findStorePrice(product, store.getId());
            if (priceForced) {
                storePriceApplier.upsertStorePrice(product, store.getId(), rowOpts.sellingPrice());
            } else if (existingStorePrice == null) {
                BigDecimal price = resolveFallbackPrice(row, product);
                storePriceApplier.upsertStorePrice(product, store.getId(), price);
            }
            storeStockService.ensurePresence(product, store);
        }
        productRepository.save(product);
        return product.getId();
    }

    /** После создания NEW: гарантируем store_stock (qty 0), иначе касса не покажет. */
    public void ensurePresenceAfterCreate(UUID productId, Integer defaultStoreId) {
        if (productId == null) {
            return;
        }
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null || product.getCompany() == null
            || !companyId.equals(product.getCompany().getId())) {
            return;
        }
        List<Store> targets = resolveTargetStores(companyId, defaultStoreId);
        for (Store store : targets) {
            storeStockService.ensurePresence(product, store);
        }
    }

    private static BigDecimal findStorePrice(Product product, Integer storeId) {
        if (product.getStorePrices() == null) {
            return null;
        }
        for (ProductStorePrice line : product.getStorePrices()) {
            if (line.getStore() != null && storeId.equals(line.getStore().getId())
                && line.getPrice() != null
                && line.getPrice().compareTo(new BigDecimal("0.01")) >= 0) {
                return line.getPrice();
            }
        }
        return null;
    }

    /** Цена только если у филиала ещё нет своей — из файла или карточки. */
    private static BigDecimal resolveFallbackPrice(ProductImportPreviewRow row, Product product) {
        if (row.fileSellingPrice() != null
            && row.fileSellingPrice().compareTo(new BigDecimal("0.01")) >= 0) {
            return row.fileSellingPrice();
        }
        if (product.getSellingPrice() != null
            && product.getSellingPrice().compareTo(new BigDecimal("0.01")) >= 0) {
            return product.getSellingPrice();
        }
        throw new BadRequestException("Некорректная цена продажи для привязки");
    }

    private static Integer resolveStoreId(
        ProductImportConfirmRequest.ImportRowConfirm rowOpts,
        Integer defaultStoreId
    ) {
        if (rowOpts != null && rowOpts.storeId() != null) {
            return rowOpts.storeId();
        }
        return defaultStoreId;
    }

    private List<Store> resolveTargetStores(Integer companyId, Integer storeId) {
        if (storeId != null) {
            Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BadRequestException("Магазин не найден: " + storeId));
            return List.of(store);
        }
        return storeRepository.findByCompanyIdOrderByNameAsc(companyId).stream()
            .filter(Store::isActive)
            .toList();
    }
}
