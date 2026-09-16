package com.pos.pharmacy.warehouse.service.impl;

import com.pos.pharmacy.catalog.dto.CreateProductRequest;
import com.pos.pharmacy.catalog.dto.ProductResponse;
import com.pos.pharmacy.catalog.dto.ProductStorePriceRequest;
import com.pos.pharmacy.catalog.service.PharmacyProductService;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.domain.ProductType;
import com.pos.pharmacy.domain.SaleType;
import com.pos.pharmacy.domain.UnitCode;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.util.ProductImportParseUtil;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptLineRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptResponse;
import com.pos.pharmacy.warehouse.dto.importing.*;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.repository.StockReceiptRepository;
import com.pos.pharmacy.warehouse.service.PharmacyReceiptImportService;
import com.pos.pharmacy.warehouse.service.PharmacyStockReceiptService;
import com.pos.pharmacy.warehouse.support.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PharmacyReceiptImportServiceImpl implements PharmacyReceiptImportService {

    private static final String STATUS_NEW = "NEW";
    private static final String STATUS_DUPLICATE = "DUPLICATE";

    private final StockReceiptRepository stockReceiptRepository;
    private final ProductRepository productRepository;
    private final TenantSupport tenant;
    private final PharmacyReceiptSupport pharmacyReceipt;
    private final PharmacyImportGridSupport gridSupport;
    private final PharmacyImportMatchSupport matchSupport;
    private final PharmacyStockReceiptService pharmacyStockReceiptService;
    private final PharmacyProductService pharmacyProductService;

    @Override
    @Transactional(readOnly = true)
    public PharmacyImportParseResponse parse(UUID receiptId, MultipartFile file) {
        requireDraft(receiptId);
        Integer companyId = tenant.requireCompanyId();
        List<List<String>> grid = gridSupport.readGrid(file);
        int headerRow = gridSupport.findHeaderRow(grid);
        String invoiceId = PharmacyImportMatchSupport.normalizeInvoiceId(gridSupport.extractInvoiceId(grid));
        return new PharmacyImportParseResponse(
            file.getOriginalFilename(),
            headerRow,
            invoiceId,
            matchSupport.isInvoiceImported(companyId, invoiceId),
            gridSupport.columns(grid.get(headerRow)),
            gridSupport.dataRows(grid, headerRow)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PharmacyImportMatchResponse match(UUID receiptId, PharmacyImportMatchRequest request) {
        StockReceipt receipt = requireDraft(receiptId);
        Integer companyId = tenant.requireCompanyId();
        String invoiceId = PharmacyImportMatchSupport.normalizeInvoiceId(request.uzInvoiceDocumentId());
        boolean invoiceImported = matchSupport.isInvoiceImported(companyId, invoiceId);
        Map<String, Integer> roles = request.roles();
        BigDecimal defaultMarkup = receipt.getDefaultMarkupPercent() != null
            ? receipt.getDefaultMarkupPercent()
            : new BigDecimal("20");
        List<PharmacyImportMatchItem> items = new ArrayList<>();
        int index = 0;
        for (List<String> row : request.rows()) {
            PharmacyImportMatchItem item = mapRow(
                index++, row, roles, defaultMarkup, request.useFinalSums(), invoiceImported, invoiceId
            );
            if (item != null) {
                items.add(item);
            }
        }
        return new PharmacyImportMatchResponse(invoiceId, invoiceImported, items);
    }

    @Override
    public PharmacyStockReceiptResponse confirm(UUID receiptId, PharmacyImportConfirmRequest request) {
        StockReceipt receipt = requireDraft(receiptId);
        Integer companyId = tenant.requireCompanyId();
        String invoiceId = PharmacyImportMatchSupport.normalizeInvoiceId(request.uzInvoiceDocumentId());
        if (matchSupport.isInvoiceImported(companyId, invoiceId)) {
            throw PharmacyErrors.badRequest(PharmacyImportMatchSupport.duplicateMessage(invoiceId));
        }
        if (!StringUtils.hasText(receipt.getInvoiceNumber()) && StringUtils.hasText(invoiceId)) {
            receipt.setInvoiceNumber(invoiceId);
            stockReceiptRepository.save(receipt);
        }
        Integer storeId = receipt.getStoreId();
        BigDecimal defaultMarkup = receipt.getDefaultMarkupPercent() != null
            ? receipt.getDefaultMarkupPercent()
            : new BigDecimal("20");
        List<PharmacyStockReceiptLineRequest> lines = new ArrayList<>();
        for (PharmacyImportConfirmItem item : request.items()) {
            if (item.quantity() == null || item.quantity().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            UUID productId = createPharmacyProduct(item, storeId, invoiceId, companyId).id();
            lines.add(toLine(item, productId, defaultMarkup));
        }
        return pharmacyStockReceiptService.addLines(receiptId, lines);
    }

    private PharmacyImportMatchItem mapRow(
        int rowIndex,
        List<String> row,
        Map<String, Integer> roles,
        BigDecimal defaultMarkup,
        boolean useFinalSums,
        boolean invoiceImported,
        String invoiceId
    ) {
        String name = PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.NAME));
        if (!StringUtils.hasText(name) || looksLikeTotal(name)) {
            return null;
        }
        String manufacturer = PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.MANUFACTURER));
        String country = PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.COUNTRY));
        String barcode = PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.BARCODE));
        String ikpu = PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.IKPU));
        String batch = PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.BATCH));
        LocalDate expiry = PharmacyImportValueParser.date(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.EXPIRY))
        );
        BigDecimal qty = PharmacyImportValueParser.decimal(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.QTY))
        );
        BigDecimal vat = PharmacyImportValueParser.decimal(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.VAT_RATE))
        );
        if (vat == null) {
            vat = BigDecimal.ZERO;
        }
        BigDecimal purchase = PharmacyImportValueParser.decimal(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.PURCHASE))
        );
        BigDecimal purchaseWithVat = PharmacyImportValueParser.decimal(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.PURCHASE_WITH_VAT))
        );
        if (purchase == null && purchaseWithVat != null) {
            purchase = withoutVat(purchaseWithVat, vat);
        }
        if (purchase == null) {
            purchase = BigDecimal.ZERO;
        }
        BigDecimal retail = PharmacyImportValueParser.decimal(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.RETAIL))
        );
        if (retail == null) {
            BigDecimal base = purchaseWithVat != null ? purchaseWithVat : withVat(purchase, vat);
            retail = base.multiply(BigDecimal.ONE.add(defaultMarkup.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);
        }
        if (useFinalSums && qty != null && qty.compareTo(BigDecimal.ZERO) > 0) {
            purchase = purchase.divide(qty, 2, RoundingMode.HALF_UP);
            retail = retail.divide(qty, 2, RoundingMode.HALF_UP);
        }
        BigDecimal units = PharmacyImportValueParser.decimal(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.UNITS_IN_PACK))
        );
        return new PharmacyImportMatchItem(
            rowIndex,
            name,
            blankToNull(manufacturer),
            blankToNull(country),
            invoiceImported ? STATUS_DUPLICATE : STATUS_NEW,
            invoiceImported ? PharmacyImportMatchSupport.duplicateMessage(invoiceId) : null,
            null,
            null,
            qty,
            purchase,
            vat,
            retail,
            blankToNull(batch),
            expiry,
            blankToNull(barcode),
            blankToNull(ikpu),
            units
        );
    }

    private PharmacyStockReceiptLineRequest toLine(
        PharmacyImportConfirmItem item,
        UUID productId,
        BigDecimal defaultMarkup
    ) {
        BigDecimal qty = item.quantity() != null ? item.quantity() : BigDecimal.ONE;
        BigDecimal purchase = item.purchasePrice() != null ? item.purchasePrice() : BigDecimal.ZERO;
        BigDecimal vat = item.vatPercent() != null ? item.vatPercent() : BigDecimal.ZERO;
        BigDecimal retail = item.retailPrice() != null
            ? item.retailPrice()
            : withVat(purchase, vat).multiply(
                BigDecimal.ONE.add(defaultMarkup.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP))
            ).setScale(2, RoundingMode.HALF_UP);
        BigDecimal markup = markupFrom(withVat(purchase, vat), retail);
        return new PharmacyStockReceiptLineRequest(
            productId,
            qty,
            purchase,
            retail,
            vat,
            markup,
            item.unitsInPack(),
            withVat(purchase, vat),
            retail,
            retail,
            item.batchNumber(),
            item.expiryDate()
        );
    }

    private ProductResponse createPharmacyProduct(
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
        String sku = StringUtils.hasText(invoiceId)
            ? ProductImportParseUtil.resolveUzInvoiceSku(invoiceId, item.rowIndex() + 1)
            : autoSku(name);
        return pharmacyProductService.create(new CreateProductRequest(
            sku,
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
            blankToNull(item.ikpu()),
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
            null,
            attrs.isEmpty() ? null : attrs
        ));
    }

    private String uniqueBarcodeOrNull(Integer companyId, String barcode) {
        String value = blankToNull(barcode);
        if (value == null || companyId == null) {
            return value;
        }
        boolean taken = productRepository.findFirstByCompanyIdAndBarcode(companyId, value).isPresent();
        return taken ? null : value;
    }

    private StockReceipt requireDraft(UUID receiptId) {
        StockReceipt receipt = stockReceiptRepository.findDetailedById(receiptId)
            .orElseThrow(() -> PharmacyErrors.notFound("Receipt"));
        if (!receipt.getCompanyId().equals(tenant.requireCompanyId())) {
            throw PharmacyErrors.badRequest("Access denied");
        }
        pharmacyReceipt.requireDraft(receipt);
        return receipt;
    }

    private static boolean looksLikeTotal(String name) {
        String n = name.toLowerCase(Locale.ROOT);
        return n.contains("жами") || n.contains("jami") || n.contains("итого") || n.contains("total");
    }

    private static BigDecimal withVat(BigDecimal purchase, BigDecimal vat) {
        if (purchase == null) {
            return BigDecimal.ZERO;
        }
        if (vat == null || vat.compareTo(BigDecimal.ZERO) == 0) {
            return purchase.setScale(2, RoundingMode.HALF_UP);
        }
        return purchase.multiply(BigDecimal.ONE.add(vat.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)))
            .setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal withoutVat(BigDecimal withVat, BigDecimal vat) {
        if (withVat == null) {
            return BigDecimal.ZERO;
        }
        if (vat == null || vat.compareTo(BigDecimal.ZERO) == 0) {
            return withVat.setScale(2, RoundingMode.HALF_UP);
        }
        return withVat.divide(
            BigDecimal.ONE.add(vat.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)),
            2,
            RoundingMode.HALF_UP
        );
    }

    private static BigDecimal markupFrom(BigDecimal base, BigDecimal retail) {
        if (base == null || base.compareTo(BigDecimal.ZERO) <= 0 || retail == null) {
            return BigDecimal.ZERO;
        }
        return retail.subtract(base).multiply(BigDecimal.valueOf(100)).divide(base, 2, RoundingMode.HALF_UP);
    }

    private static String autoSku(String name) {
        String slug = name.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9А-ЯЁ]+", "");
        if (slug.length() > 8) {
            slug = slug.substring(0, 8);
        }
        if (!StringUtils.hasText(slug)) {
            slug = "ITEM";
        }
        return "PH-" + slug + "-" + Long.toString(System.nanoTime(), 36).toUpperCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
