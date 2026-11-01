package com.pos.pharmacy.catalog.service;

import com.pos.pharmacy.catalog.dto.UpdateProductRequest;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.support.PharmacyDbFieldLimits;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/** Пишет ИКПУ и выбранный код упаковки Tasnif в карточку при обновлении. */
@Component
public class ProductFiscalFieldsApplier {

    public void apply(Product product, UpdateProductRequest req) {
        if (req.ikpu() != null) {
            product.setIkpu(PharmacyDbFieldLimits.ikpu(req.ikpu()));
        }
        if (req.ikpuStatus() != null) {
            product.setIkpuStatus(PharmacyDbFieldLimits.ikpuStatus(req.ikpuStatus()));
        }
        if (req.packageCode() != null) {
            product.setPackageCode(PharmacyDbFieldLimits.packageCode(req.packageCode()));
        }
        if (req.unitOfMeasure() != null) {
            product.setUnitOfMeasure(trimToNull(req.unitOfMeasure()));
        }
        if (req.unitMeasureCode() != null) {
            product.setUnitMeasureCode(trimToNull(req.unitMeasureCode()));
        }
        if (req.externalProductId() != null) {
            product.setExternalProductId(trimToNull(req.externalProductId()));
        }
        if (req.storageLocation() != null) {
            product.setStorageLocation(trimToNull(req.storageLocation()));
        }
        if (req.soldIndividually() != null) {
            product.setSoldIndividually(req.soldIndividually());
        }
        if (req.markedProduct() != null) {
            product.setMarkedProduct(req.markedProduct());
        }
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
