package com.pos.catalog.repository.spec;

import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductAttribute;
import com.pos.catalog.entity.ProductBarcode;
import com.pos.catalog.entity.ProductStorePrice;
import com.pos.domain.businessconfig.BusinessTypeCodes;
import com.pos.shared.text.CatalogSearchFold;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<Product> catalogFilter(
        Integer companyId,
        String search,
        Integer categoryId,
        String deletedScope,
        Integer storeId,
        String ikpuStatus,
        Boolean markedProduct,
        Boolean soldIndividually,
        String barcodeExact,
        Map<String, String> attributeFilters
    ) {
        return catalogFilter(
            companyId, search, categoryId, deletedScope, storeId, ikpuStatus,
            markedProduct, soldIndividually, barcodeExact, attributeFilters, null
        );
    }

    public static Specification<Product> catalogFilter(
        Integer companyId,
        String search,
        Integer categoryId,
        String deletedScope,
        Integer storeId,
        String ikpuStatus,
        Boolean markedProduct,
        Boolean soldIndividually,
        String barcodeExact,
        Map<String, String> attributeFilters,
        String businessTypeCode
    ) {
        return (root, query, cb) -> {

            List<Predicate> parts = new ArrayList<>();

            if (companyId != null) {
                parts.add(cb.equal(root.get("company").get("id"), companyId));
            }

            String q = search != null ? search.trim() : "";
            if (StringUtils.hasText(q)) {
                query.distinct(true);
                Join<Product, ProductBarcode> extras = root.join("extraBarcodes", JoinType.LEFT);
                var name = containsFolded(cb, root.get("name"), q);
                var sku = containsFolded(cb, root.get("sku"), q);
                var description = cb.and(
                    cb.isNotNull(root.get("description")),
                    containsFolded(cb, root.get("description"), q)
                );
                var unitOfMeasure = cb.and(
                    cb.isNotNull(root.get("unitOfMeasure")),
                    containsFolded(cb, root.get("unitOfMeasure"), q)
                );
                var bc = cb.and(
                    cb.isNotNull(root.get("barcode")),
                    containsFolded(cb, root.get("barcode"), q)
                );
                var extraBc = cb.and(
                    cb.isNotNull(extras.get("barcode")),
                    containsFolded(cb, extras.get("barcode"), q)
                );
                var ikpu = cb.and(
                    cb.isNotNull(root.get("ikpu")),
                    containsFolded(cb, root.get("ikpu"), q)
                );
                Subquery<Long> attrSearch = query.subquery(Long.class);
                Root<ProductAttribute> attrRoot = attrSearch.from(ProductAttribute.class);
                attrSearch.select(cb.literal(1L));
                attrSearch.where(
                    cb.equal(attrRoot.get("productId"), root.get("id")),
                    cb.isNotNull(attrRoot.get("valueText")),
                    containsFolded(cb, attrRoot.get("valueText"), q)
                );
                parts.add(cb.or(name, sku, description, unitOfMeasure, bc, extraBc, ikpu, cb.exists(attrSearch)));
            }

            if (categoryId != null) {
                parts.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            String scope = deletedScope != null ? deletedScope : "ACTIVE";
            switch (scope) {
                case "ALL" -> { /* no filter */ }
                case "DELETED" -> parts.add(cb.isFalse(root.get("isActive")));
                default -> parts.add(cb.isTrue(root.get("isActive")));
            }

            if (StringUtils.hasText(ikpuStatus) && !"ALL".equalsIgnoreCase(ikpuStatus)) {
                parts.add(cb.equal(root.get("ikpuStatus"), ikpuStatus));
            }

            if (markedProduct != null) {
                parts.add(cb.equal(root.get("markedProduct"), markedProduct));
            }

            if (soldIndividually != null) {
                parts.add(cb.equal(root.get("soldIndividually"), soldIndividually));
            }

            if (StringUtils.hasText(barcodeExact)) {
                parts.add(cb.equal(root.get("barcode"), barcodeExact.trim()));
            }

            if (attributeFilters != null && !attributeFilters.isEmpty()) {
                for (Map.Entry<String, String> entry : attributeFilters.entrySet()) {
                    if (!StringUtils.hasText(entry.getKey()) || !StringUtils.hasText(entry.getValue())) {
                        continue;
                    }
                    Subquery<Long> attrFilter = query.subquery(Long.class);
                    Root<ProductAttribute> attrRoot = attrFilter.from(ProductAttribute.class);
                    attrFilter.select(cb.literal(1L));
                    attrFilter.where(
                        cb.equal(attrRoot.get("productId"), root.get("id")),
                        cb.equal(cb.lower(attrRoot.get("fieldKey")), entry.getKey().trim().toLowerCase()),
                        cb.equal(attrRoot.get("valueText"), entry.getValue().trim())
                    );
                    parts.add(cb.exists(attrFilter));
                }
            }

            addBusinessTypeFilter(parts, root, cb, businessTypeCode);

            // storeId здесь НЕ режет ассортимент: цена/остаток подставляются в mapPage
            // (store price или sellingPrice). Иначе при выключенном блоке цен магазинов
            // bootstrap кассы возвращает 0 товаров и затирает локальный каталог.

            return parts.isEmpty() ? cb.conjunction() : cb.and(parts.toArray(new Predicate[0]));
        };
    }

    /**
     * Склад: только активные товары; поиск по названию; штрихкод (основной или доп.);
     * фильтр по маркировке.
     */
    public static Specification<Product> warehouseFilter(
        Integer companyId,
        String search,
        String barcodeContains,
        Boolean markedProduct
    ) {
        return warehouseFilter(companyId, search, barcodeContains, markedProduct, null);
    }

    public static Specification<Product> warehouseFilter(
        Integer companyId,
        String search,
        String barcodeContains,
        Boolean markedProduct,
        String businessTypeCode
    ) {
        return (root, query, cb) -> {
            List<Predicate> parts = new ArrayList<>();
            parts.add(cb.isTrue(root.get("isActive")));
            if (companyId != null) {
                parts.add(cb.equal(root.get("company").get("id"), companyId));
            }

            String q = search != null ? search.trim() : "";
            if (StringUtils.hasText(q)) {
                query.distinct(true);
                Join<Product, ProductBarcode> extras = root.join("extraBarcodes", JoinType.LEFT);
                String[] tokens = q.split("\\s+");
                List<Predicate> andTokens = new ArrayList<>();
                for (String token : tokens) {
                    if (!StringUtils.hasText(token)) {
                        continue;
                    }
                    var name = containsFolded(cb, root.get("name"), token);
                    var sku = containsFolded(cb, root.get("sku"), token);
                    var bc = cb.and(
                        cb.isNotNull(root.get("barcode")),
                        containsFolded(cb, root.get("barcode"), token)
                    );
                    var extraBc = cb.and(
                        cb.isNotNull(extras.get("barcode")),
                        containsFolded(cb, extras.get("barcode"), token)
                    );
                    var ikpu = cb.and(
                        cb.isNotNull(root.get("ikpu")),
                        containsFolded(cb, root.get("ikpu"), token)
                    );
                    andTokens.add(cb.or(name, sku, bc, extraBc, ikpu));
                }
                if (!andTokens.isEmpty()) {
                    parts.add(cb.and(andTokens.toArray(new Predicate[0])));
                }
            }

            if (markedProduct != null) {
                parts.add(cb.equal(root.get("markedProduct"), markedProduct));
            }

            if (StringUtils.hasText(barcodeContains)) {
                // LEFT JOIN + DISTINCT: correlated EXISTS в count-запросе Spring Data иногда даёт 500 на Hibernate 6
                query.distinct(true);
                String barcodeToken = barcodeContains.trim();
                Join<Product, ProductBarcode> extras = root.join("extraBarcodes", JoinType.LEFT);
                var primaryLike = cb.and(
                    cb.isNotNull(root.get("barcode")),
                    containsFolded(cb, root.get("barcode"), barcodeToken)
                );
                var extraLike = cb.and(
                    cb.isNotNull(extras.get("barcode")),
                    containsFolded(cb, extras.get("barcode"), barcodeToken)
                );
                parts.add(cb.or(primaryLike, extraLike));
            }

            addBusinessTypeFilter(parts, root, cb, businessTypeCode);

            return cb.and(parts.toArray(new Predicate[0]));
        };
    }

    private static Expression<String> folded(CriteriaBuilder cb, Expression<String> value) {
        return cb.function(
            "translate",
            String.class,
            value,
            cb.literal(CatalogSearchFold.FROM),
            cb.literal(CatalogSearchFold.TO)
        );
    }

    private static Predicate containsFolded(CriteriaBuilder cb, Expression<String> column, String token) {
        Expression<String> pattern = cb.concat("%", cb.concat(folded(cb, cb.literal(token)), "%"));
        return cb.like(folded(cb, column), pattern);
    }

    private static void addBusinessTypeFilter(
        List<Predicate> parts,
        Root<Product> root,
        CriteriaBuilder cb,
        String businessTypeCode
    ) {
        Join<?, ?> typeJoin = root.join("businessType", JoinType.LEFT);
        if (StringUtils.hasText(businessTypeCode)) {
            parts.add(cb.equal(
                cb.upper(typeJoin.get("code")),
                businessTypeCode.trim().toUpperCase()
            ));
            return;
        }
        parts.add(cb.or(
            cb.isNull(typeJoin.get("id")),
            cb.notEqual(cb.upper(typeJoin.get("code")), BusinessTypeCodes.PHARMACY)
        ));
    }

    /** Точный поиск одного товара: SKU, штрихкод, ИКПУ/МХИК, e-фактура и т.д. */
    public static LookupBuilder lookup(Integer companyId) {
        return new LookupBuilder(companyId);
    }

    public static final class LookupBuilder {

        private final Integer companyId;
        private String sku;
        private String nameIgnoreCase;
        private String barcode;
        private String ikpu;
        private String uzInvoiceDocumentId;
        private String skuStartsWith;
        private Boolean activeOnly = true;

        private LookupBuilder(Integer companyId) {
            if (companyId == null) {
                throw new IllegalArgumentException("companyId is required");
            }
            this.companyId = companyId;
        }

        public LookupBuilder sku(String value) {
            this.sku = value;
            return this;
        }

        public LookupBuilder nameIgnoreCase(String value) {
            this.nameIgnoreCase = value;
            return this;
        }

        public LookupBuilder barcode(String value) {
            this.barcode = value;
            return this;
        }

        /** Точный MXIK/ИКПУ (например 03305005001000000) — пробитие на кассе. */
        public LookupBuilder ikpu(String value) {
            this.ikpu = value;
            return this;
        }

        public LookupBuilder uzInvoiceDocumentId(String value) {
            this.uzInvoiceDocumentId = value;
            return this;
        }

        public LookupBuilder skuStartsWith(String prefix) {
            this.skuStartsWith = prefix;
            return this;
        }

        public LookupBuilder activeOnly(boolean value) {
            this.activeOnly = value;
            return this;
        }

        /** Без фильтра isActive — для reactivate и проверки штрихкода. */
        public LookupBuilder anyActiveState() {
            this.activeOnly = null;
            return this;
        }

        public Specification<Product> build() {
            if (!StringUtils.hasText(sku)
                && !StringUtils.hasText(nameIgnoreCase)
                && !StringUtils.hasText(barcode)
                && !StringUtils.hasText(ikpu)
                && !StringUtils.hasText(uzInvoiceDocumentId)
                && !StringUtils.hasText(skuStartsWith)) {
                throw new IllegalStateException("At least one lookup field is required");
            }
            return (root, query, cb) -> {
                List<Predicate> parts = new ArrayList<>();
                parts.add(cb.equal(root.get("company").get("id"), companyId));

                if (Boolean.TRUE.equals(activeOnly)) {
                    parts.add(cb.isTrue(root.get("isActive")));
                } else if (Boolean.FALSE.equals(activeOnly)) {
                    parts.add(cb.isFalse(root.get("isActive")));
                }

                if (StringUtils.hasText(sku)) {
                    parts.add(cb.equal(root.get("sku"), sku.trim()));
                }
                if (StringUtils.hasText(nameIgnoreCase)) {
                    String name = nameIgnoreCase.trim();
                    parts.add(cb.equal(folded(cb, root.get("name")), folded(cb, cb.literal(name))));
                }
                if (StringUtils.hasText(barcode)) {
                    parts.add(cb.equal(root.get("barcode"), barcode.trim()));
                }
                if (StringUtils.hasText(ikpu)) {
                    parts.add(cb.equal(root.get("ikpu"), ikpu.trim()));
                }
                if (StringUtils.hasText(uzInvoiceDocumentId)) {
                    parts.add(cb.equal(root.get("uzInvoiceDocumentId"), uzInvoiceDocumentId.trim()));
                }
                if (StringUtils.hasText(skuStartsWith)) {
                    parts.add(cb.like(root.get("sku"), skuStartsWith.trim() + "%"));
                }

                return cb.and(parts.toArray(new Predicate[0]));
            };
        }
    }

    /** Товар имеет цену хотя бы в одном из указанных магазинов. */
    public static Specification<Product> storePriceInOneOf(List<Integer> storeIds) {
        if (storeIds == null || storeIds.isEmpty()) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> {
            Subquery<Long> sq = query.subquery(Long.class);
            Root<ProductStorePrice> spRoot = sq.from(ProductStorePrice.class);
            sq.select(cb.literal(1L));
            sq.where(
                cb.equal(spRoot.get("product").get("id"), root.get("id")),
                spRoot.get("store").get("id").in(storeIds)
            );
            return cb.exists(sq);
        };
    }
}
