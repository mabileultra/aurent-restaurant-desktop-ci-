package com.pos.catalog.service.imports.support;

import com.pos.catalog.dto.product.ProductImportConfirmRequest;
import com.pos.catalog.dto.product.ProductImportPreviewRow;
import com.pos.exception.BadRequestException;
import com.pos.util.QuantityUtil;

import java.math.BigDecimal;

/** Количество строки импорта: правка из предпросмотра важнее числа в файле. */
public final class ProductImportQuantity {

    private ProductImportQuantity() {
    }

    public static BigDecimal resolve(
        ProductImportPreviewRow row,
        ProductImportConfirmRequest.ImportRowConfirm rowOpts
    ) {
        BigDecimal raw = rowOpts != null && rowOpts.quantity() != null
            ? rowOpts.quantity()
            : (row != null ? row.quantity() : null);
        BigDecimal qty = QuantityUtil.normalize(raw);
        if (qty.signum() < 0) {
            throw new BadRequestException("Количество не может быть отрицательным");
        }
        return qty;
    }
}
