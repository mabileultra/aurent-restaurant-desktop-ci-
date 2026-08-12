package com.pos.telegram.service.impl;

import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductStorePrice;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.repository.ProductStorePriceRepository;
import com.pos.catalog.repository.spec.ProductSpecifications;
import com.pos.catalog.service.ProductAttributeService;
import com.pos.entity.Store;
import com.pos.entity.StoreStock;
import com.pos.exception.PosExceptions;
import com.pos.inventory.repository.StoreStockRepository;
import com.pos.repository.StoreRepository;
import com.pos.shared.log.LogUtil;
import com.pos.telegram.config.TelegramBotProperties;
import com.pos.telegram.dto.MedicineSearchItemDto;
import com.pos.telegram.dto.MedicineSearchResponse;
import com.pos.telegram.dto.MedicineStoreMatchDto;
import com.pos.telegram.dto.TelegramStoreDto;
import com.pos.telegram.service.TelegramMedicineSearchService;
import com.pos.telegram.support.TelegramBotCompanyResolver;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TelegramMedicineSearchServiceImpl implements TelegramMedicineSearchService {

    private static final String PHARMACY = "PHARMACY";

    private final ProductRepository productRepository;
    private final ProductStorePriceRepository productStorePriceRepository;
    private final StoreStockRepository storeStockRepository;
    private final StoreRepository storeRepository;
    private final ProductAttributeService productAttributeService;
    private final TelegramBotProperties properties;
    private final TelegramBotCompanyResolver companyResolver;

    @Override
    public MedicineSearchResponse search(String query) {
        Integer companyId = companyResolver.requireCompanyId();
        String q = query != null ? query.trim() : "";
        if (q.length() < properties.getMinQueryLength()) {
            throw PosExceptions.badRequest(
                "Введите минимум " + properties.getMinQueryLength() + " символа для поиска"
            );
        }

        int limit = Math.max(1, Math.min(properties.getMaxResults(), 25));
        String barcodeExact = resolveBarcodeExact(q);
        String searchText = barcodeExact != null ? null : q;

        List<Product> products = productRepository.findAll(
            ProductSpecifications.catalogFilter(
                companyId,
                searchText,
                null,
                "ACTIVE",
                null,
                null,
                null,
                null,
                barcodeExact,
                null
            ),
            PageRequest.of(0, limit, Sort.by(Sort.Direction.ASC, "name"))
        ).getContent();

        if (products.isEmpty()) {
            LogUtil.info(
                TelegramMedicineSearchServiceImpl.class,
                "Telegram medicine search empty: company={}, q={}",
                companyId,
                q
            );
            return new MedicineSearchResponse(q, 0, List.of());
        }

        List<MedicineSearchItemDto> items = buildItems(products, companyId);
        LogUtil.info(
            TelegramMedicineSearchServiceImpl.class,
            "Telegram medicine search: company={}, q={}, products={}, items={}",
            companyId,
            q,
            products.size(),
            items.size()
        );
        return new MedicineSearchResponse(q, items.size(), items);
    }

    @Override
    public MedicineSearchItemDto getProductAvailability(UUID productId) {
        Integer companyId = companyResolver.requireCompanyId();
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> PosExceptions.notFound("Товар не найден"));
        if (!product.isActive()) {
            throw PosExceptions.notFound("Товар не найден");
        }
        if (product.getCompany() == null || !companyId.equals(product.getCompany().getId())) {
            throw PosExceptions.notFound("Товар не найден");
        }
        List<MedicineSearchItemDto> items = buildItems(List.of(product), companyId);
        if (items.isEmpty()) {
            throw PosExceptions.notFound("Товар не найден в магазинах");
        }
        return items.get(0);
    }

    @Override
    public List<TelegramStoreDto> listActiveStores() {
        Integer companyId = companyResolver.requireCompanyId();
        List<Store> companyStores = storeRepository.findByCompanyIdOrderByNameAsc(companyId).stream()
            .filter(Store::isActive)
            .toList();

        List<Store> pharmacyStores = companyStores.stream()
            .filter(this::isPharmacyStore)
            .toList();

        List<Store> stores = pharmacyStores.isEmpty() ? companyStores : pharmacyStores;

        return stores.stream()
            .map(store -> new TelegramStoreDto(
                store.getId(),
                store.getName(),
                store.getAddress(),
                store.getPhone(),
                store.getBusinessType()
            ))
            .toList();
    }

    private boolean isPharmacyStore(Store store) {
        return store.getBusinessType() != null
            && PHARMACY.equalsIgnoreCase(store.getBusinessType().trim());
    }

    private List<MedicineSearchItemDto> buildItems(List<Product> products, Integer companyId) {
        List<UUID> productIds = products.stream().map(Product::getId).toList();
        Map<UUID, List<ProductStorePrice>> pricesByProduct = groupStorePrices(productIds);
        Map<String, BigDecimal> stockByKey = groupStock(productIds);

        List<MedicineSearchItemDto> items = new ArrayList<>();
        for (Product product : products) {
            List<ProductStorePrice> prices = pricesByProduct.getOrDefault(product.getId(), List.of());
            Map<String, String> attributes = productAttributeService.getAttributes(product.getId());
            List<MedicineStoreMatchDto> matches = new ArrayList<>();

            if (prices.isEmpty()) {
                matches.add(new MedicineStoreMatchDto(
                    null,
                    "Без привязки к магазину",
                    null,
                    null,
                    product.getSellingPrice(),
                    QuantityUtil.normalize(product.getStockQuantity()),
                    attributes.isEmpty() ? Map.of() : attributes
                ));
            } else {
                for (ProductStorePrice priceRow : prices) {
                    Store store = priceRow.getStore();
                    if (store == null || !store.isActive()) {
                        continue;
                    }
                    if (store.getCompany() == null || !companyId.equals(store.getCompany().getId())) {
                        continue;
                    }
                    BigDecimal stock = stockByKey.getOrDefault(
                        stockKey(product.getId(), store.getId()),
                        BigDecimal.ZERO.setScale(QuantityUtil.SCALE)
                    );
                    matches.add(new MedicineStoreMatchDto(
                        store.getId(),
                        store.getName(),
                        store.getAddress(),
                        store.getPhone(),
                        priceRow.getPrice() != null ? priceRow.getPrice() : product.getSellingPrice(),
                        stock,
                        attributes.isEmpty() ? Map.of() : attributes
                    ));
                }
            }

            if (matches.isEmpty()) {
                continue;
            }

            matches.sort((a, b) -> {
                BigDecimal pa = a.price() != null ? a.price() : BigDecimal.valueOf(Long.MAX_VALUE);
                BigDecimal pb = b.price() != null ? b.price() : BigDecimal.valueOf(Long.MAX_VALUE);
                return pa.compareTo(pb);
            });

            items.add(new MedicineSearchItemDto(
                product.getId(),
                product.getName(),
                product.getBarcode(),
                product.getIkpu(),
                matches
            ));
        }
        return items;
    }

    private Map<UUID, List<ProductStorePrice>> groupStorePrices(List<UUID> productIds) {
        Map<UUID, List<ProductStorePrice>> map = new HashMap<>();
        for (ProductStorePrice row : productStorePriceRepository.findActiveStorePricesByProductIds(productIds)) {
            map.computeIfAbsent(row.getProduct().getId(), ignored -> new ArrayList<>()).add(row);
        }
        return map;
    }

    private Map<String, BigDecimal> groupStock(List<UUID> productIds) {
        Map<String, BigDecimal> map = new HashMap<>();
        for (StoreStock stock : storeStockRepository.findByProductIdIn(productIds)) {
            if (stock.getProduct() == null || stock.getStore() == null) {
                continue;
            }
            map.put(
                stockKey(stock.getProduct().getId(), stock.getStore().getId()),
                QuantityUtil.normalize(stock.getQuantity())
            );
        }
        return map;
    }

    private static String stockKey(UUID productId, Integer storeId) {
        return productId + ":" + storeId;
    }

    private static String resolveBarcodeExact(String query) {
        if (!StringUtils.hasText(query)) {
            return null;
        }
        String digits = query.replaceAll("\\D", "");
        String compact = query.replaceAll("\\s", "");
        if (digits.length() >= 8 && digits.length() >= compact.length() * 0.8) {
            return digits;
        }
        return null;
    }
}
