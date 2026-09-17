package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.dto.CreateProductRequest;
import com.pos.pharmacy.catalog.dto.ProductStorePriceRequest;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.domain.ProductType;
import com.pos.pharmacy.domain.SaleType;
import com.pos.pharmacy.domain.UnitCode;
import com.pos.pharmacy.util.ProductImportParseUtil;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportConfirmItem;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class PharmacyImportProductFactory {

    private final ProductRepository productRepository;

    public PharmacyImportProductFactory(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public String sku(String invoiceId, PharmacyImportConfirmItem item) {
        String raw = StringUtils.hasText(invoiceId)
            ? ProductImportParseUtil.resolveUzInvoiceSku(invoiceId, item.rowIndex() + 1)
            : autoSku(item.excelName(), item.rowIndex());
        if (raw.length() <= 100) {
            return raw;
        }
        return raw.substring(0, 92) + "-" + item.rowIndex();
    }

    public CreateProductRequest request(
        PharmacyImportConfirmItem item,
        Integer storeId,
        String invoiceId,
        Integer companyId
    ) {
        String name = StringUtils.hasText(item.excelName()) ? item.excelName().trim() : "Импорт";
        BigDecimal cost = item.purchasePrice() != null ? item.purchasePrice() : BigDecimal.ZERO;
        BigDecimal selling = item.retailPrice() != null && item.retailPrice().compareTo(new BigDecimal("0.01")) >= 0
            ? item.retailPrice()
            : new BigDecimal("0.01");
        Map<String, String> attrs = new LinkedHashMap<>();
        if (StringUtils.hasText(item.manufacturer())) {
            attrs.put(PharmacyReceiptSupport.ATTR_MANUFACTURER, item.manufacturer().trim());
        }
        if (StringUtils.hasText(item.country())) {
            attrs.put(PharmacyReceiptSupport.ATTR_COUNTRY, item.country().trim());
        }
        BigDecimal units = item.unitsInPack() != null && item.unitsInPack().compareTo(BigDecimal.ZERO) > 0
            ? item.unitsInPack()
            : BigDecimal.ONE;
        attrs.put(PharmacyReceiptSupport.ATTR_UNITS_IN_PACK, units.stripTrailingZeros().toPlainString());
        return new CreateProductRequest(
            sku(invoiceId, item),
            name,
            null,
            null,
            cost,
            selling,
            BigDecimal.ZERO,
            item.vatPercent() != null ? item.vatPercent() : BigDecimal.ZERO,
            ProductType.RETAIL,
            SaleType.PIECE,
            UnitCode.PCS,
            units.compareTo(BigDecimal.ONE) > 0 ? 3 : 0,
            units.compareTo(BigDecimal.ONE) > 0,
            BigDecimal.ZERO,
            null,
            uniqueBarcodeOrNull(companyId, item.barcode()),
            null,
            null,
            null,
            blank(item.ikpu()),
            StringUtils.hasText(item.ikpu()) ? "MANUAL" : null,
            "pcs",
            null,
            null,
            units.compareTo(BigDecimal.ONE) > 0,
            false,
            null,
            "OWN",
            null,
            null,
            invoiceId,
            storeId == null ? null : List.of(new ProductStorePriceRequest(storeId, selling)),
            null,
            null,
            null,
            "PHARMACY",
            attrs
        );
    }

    private String uniqueBarcodeOrNull(Integer companyId, String barcode) {
        String value = blank(barcode);
        if (value == null || companyId == null) {
            return value;
        }
        return productRepository.findFirstByCompanyIdAndBarcode(companyId, value).isPresent() ? null : value;
    }

    private static String autoSku(String name, int rowIndex) {
        String source = StringUtils.hasText(name) ? name : "ITEM";
        String slug = source.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9А-ЯЁ]+", "");
        if (slug.length() > 8) {
            slug = slug.substring(0, 8);
        }
        if (!StringUtils.hasText(slug)) {
            slug = "ITEM";
        }
        return "PH-" + slug + "-" + rowIndex;
    }

    private static String blank(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
