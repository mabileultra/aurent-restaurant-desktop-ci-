package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.service.ProductAttributeService;
import com.pos.pharmacy.catalog.support.PharmacyPackSupport;
import com.pos.pharmacy.util.QuantityUtil;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Копирует фасовку со строки фактуры в карточку товара.
 * При units_in_pack &gt; 1 включает поштучную/дробную продажу на кассе.
 */
final class PharmacyReceiptUnitsInPackSync {

    private PharmacyReceiptUnitsInPackSync() {
    }

    static void apply(Product product, BigDecimal unitsInPack, ProductAttributeService attributes) {
        if (product == null || attributes == null) {
            return;
        }
        UUID productId = product.getId();
        if (productId == null || unitsInPack == null || unitsInPack.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        String value = QuantityUtil.normalize(unitsInPack).stripTrailingZeros().toPlainString();
        attributes.upsertAttribute(productId, PharmacyPackSupport.ATTR_UNITS_IN_PACK, value);
        if (unitsInPack.compareTo(BigDecimal.ONE) > 0) {
            product.setSoldIndividually(true);
            product.setAllowFraction(true);
            if (product.getQuantityScale() < QuantityUtil.SCALE) {
                product.setQuantityScale(QuantityUtil.SCALE);
            }
        }
    }
}
