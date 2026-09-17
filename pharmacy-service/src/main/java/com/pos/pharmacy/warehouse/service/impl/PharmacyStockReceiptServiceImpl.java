package com.pos.pharmacy.warehouse.service.impl;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.service.ProductCatalogService;
import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.warehouse.domain.StockReceiptStatus;
import com.pos.pharmacy.warehouse.dto.*;
import com.pos.pharmacy.warehouse.entity.StockLot;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import com.pos.pharmacy.warehouse.entity.Supplier;
import com.pos.pharmacy.warehouse.repository.StockLotRepository;
import com.pos.pharmacy.warehouse.repository.StockReceiptRepository;
import com.pos.pharmacy.warehouse.repository.SupplierRepository;
import com.pos.pharmacy.warehouse.service.PharmacyStockReceiptService;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptSupport;
import com.pos.pharmacy.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PharmacyStockReceiptServiceImpl implements PharmacyStockReceiptService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockReceiptRepository stockReceiptRepository;
    private final StockLotRepository stockLotRepository;
    private final SupplierRepository supplierRepository;
    private final ProductCatalogService productCatalogService;
    private final StoreStockService storeStockService;
    private final PharmacyReceiptSupport pharmacyReceipt;
    private final TenantSupport tenant;

    @Override
    public PharmacyStockReceiptResponse createDraft(CreatePharmacyStockReceiptRequest request) {
        Integer companyId = tenant.requireCompanyId();
        StockReceipt receipt = stockReceiptRepository.save(StockReceipt.builder()
            .companyId(companyId)
            .receiptNumber(nextReceiptNumber())
            .status(StockReceiptStatus.DRAFT)
            .documentDate(request.documentDate() != null ? request.documentDate() : LocalDate.now(ZONE))
            .receiptType(StringUtils.hasText(request.receiptType())
                ? request.receiptType().trim()
                : PharmacyReceiptSupport.DEFAULT_RECEIPT_TYPE)
            .defaultMarkupPercent(request.defaultMarkupPercent())
            .invoiceNumber(PharmacyReceiptSupport.trimToNull(request.invoiceNumber()))
            .invoiceDate(request.invoiceDate())
            .contractNumber(PharmacyReceiptSupport.trimToNull(request.contractNumber()))
            .financialDiscount(request.financialDiscount())
            .paymentType(normalizePayment(request.paymentType()))
            .supplierId(request.supplierId())
            .storeId(request.storeId())
            .notes(PharmacyReceiptSupport.trimToNull(request.notes()))
            .createdBy(tenant.currentUserId())
            .totalQuantity(BigDecimal.ZERO)
            .totalCost(BigDecimal.ZERO)
            .totalRetail(BigDecimal.ZERO)
            .build());
        return pharmacyReceipt.toResponse(receipt);
    }

    @Override
    public PharmacyStockReceiptResponse updateDraft(UUID id, UpdatePharmacyStockReceiptRequest request) {
        StockReceipt receipt = requireAccessible(id);
        pharmacyReceipt.requireDraft(receipt);
        if (request.storeId() != null) {
            receipt.setStoreId(request.storeId());
        }
        if (request.supplierId() != null) {
            receipt.setSupplierId(request.supplierId());
        }
        if (request.documentDate() != null) {
            receipt.setDocumentDate(request.documentDate());
        }
        if (request.receiptType() != null) {
            receipt.setReceiptType(PharmacyReceiptSupport.trimToNull(request.receiptType()));
        }
        if (request.defaultMarkupPercent() != null) {
            receipt.setDefaultMarkupPercent(request.defaultMarkupPercent());
        }
        if (request.invoiceNumber() != null) {
            receipt.setInvoiceNumber(PharmacyReceiptSupport.trimToNull(request.invoiceNumber()));
        }
        if (request.invoiceDate() != null) {
            receipt.setInvoiceDate(request.invoiceDate());
        }
        if (request.contractNumber() != null) {
            receipt.setContractNumber(PharmacyReceiptSupport.trimToNull(request.contractNumber()));
        }
        if (request.financialDiscount() != null) {
            receipt.setFinancialDiscount(request.financialDiscount());
        }
        if (request.paymentType() != null) {
            receipt.setPaymentType(normalizePayment(request.paymentType()));
        }
        if (request.notes() != null) {
            receipt.setNotes(PharmacyReceiptSupport.trimToNull(request.notes()));
        }
        return pharmacyReceipt.toResponse(stockReceiptRepository.save(receipt));
    }

    @Override
    @Transactional(readOnly = true)
    public PharmacyStockReceiptResponse getById(UUID id) {
        return pharmacyReceipt.toResponse(requireAccessibleDetailed(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PharmacyStockReceiptResponse> list(Integer storeId, String status, String search, Pageable pageable) {
        Integer companyId = tenant.requireCompanyId();
        String statusFilter = StringUtils.hasText(status) ? status.trim() : null;
        String searchPattern = StringUtils.hasText(search)
            ? "%" + search.trim().toLowerCase() + "%"
            : null;
        Page<StockReceipt> page = stockReceiptRepository.findReceipts(
            companyId, storeId, statusFilter, searchPattern, pageable
        );
        return PageResponse.from(page.map(pharmacyReceipt::toSummary));
    }

    @Override
    public PharmacyStockReceiptResponse replaceLines(UUID id, List<PharmacyStockReceiptLineRequest> lines) {
        StockReceipt receipt = requireAccessibleDetailed(id);
        pharmacyReceipt.requireDraft(receipt);
        requireLines(lines);
        List<StockReceiptLine> built = new ArrayList<>();
        for (PharmacyStockReceiptLineRequest lineReq : lines) {
            built.add(buildValidatedLine(receipt, lineReq));
        }
        receipt.getLines().clear();
        receipt.getLines().addAll(built);
        pharmacyReceipt.recalculateTotals(receipt);
        return pharmacyReceipt.toResponse(stockReceiptRepository.save(receipt));
    }

    @Override
    public PharmacyStockReceiptResponse addLine(UUID id, PharmacyStockReceiptLineRequest lineReq) {
        StockReceipt receipt = requireAccessibleDetailed(id);
        pharmacyReceipt.requireDraft(receipt);
        receipt.getLines().add(buildValidatedLine(receipt, lineReq));
        pharmacyReceipt.recalculateTotals(receipt);
        return pharmacyReceipt.toResponse(stockReceiptRepository.save(receipt));
    }

    @Override
    public PharmacyStockReceiptResponse addLines(UUID id, List<PharmacyStockReceiptLineRequest> lines) {
        StockReceipt receipt = requireAccessibleDetailed(id);
        pharmacyReceipt.requireDraft(receipt);
        if (lines == null || lines.isEmpty()) {
            throw PharmacyErrors.badRequest("Import has no lines to save");
        }
        for (PharmacyStockReceiptLineRequest lineReq : lines) {
            receipt.getLines().add(buildValidatedLine(receipt, lineReq));
        }
        pharmacyReceipt.recalculateTotals(receipt);
        return pharmacyReceipt.toResponse(stockReceiptRepository.save(receipt));
    }

    @Override
    public PharmacyStockReceiptResponse updateLine(UUID id, UUID lineId, PharmacyStockReceiptLineRequest lineReq) {
        StockReceipt receipt = requireAccessibleDetailed(id);
        pharmacyReceipt.requireDraft(receipt);
        StockReceiptLine existing = receipt.getLines().stream()
            .filter(line -> line.getId().equals(lineId))
            .findFirst()
            .orElseThrow(() -> PharmacyErrors.notFound("Receipt line"));
        Product product = productCatalogService.requireActive(lineReq.productId());
        pharmacyReceipt.applyLine(existing, product, lineReq);
        pharmacyReceipt.recalculateTotals(receipt);
        return pharmacyReceipt.toResponse(stockReceiptRepository.save(receipt));
    }

    @Override
    public PharmacyStockReceiptResponse revalueLines(UUID id, PharmacyReceiptRevalueRequest request) {
        StockReceipt receipt = requireAccessibleDetailed(id);
        pharmacyReceipt.requireDraft(receipt);
        if (request == null || (request.vatPercent() == null && request.markupPercent() == null)) {
            throw PharmacyErrors.badRequest("Specify vatPercent and/or markupPercent");
        }
        Set<UUID> selected = request.lineIds() == null || request.lineIds().isEmpty()
            ? null
            : new HashSet<>(request.lineIds());
        int updated = 0;
        for (StockReceiptLine line : receipt.getLines()) {
            if (selected != null && !selected.contains(line.getId())) {
                continue;
            }
            pharmacyReceipt.revalueLine(line, request.vatPercent(), request.markupPercent());
            updated++;
        }
        if (updated == 0) {
            throw PharmacyErrors.badRequest("No lines to revalue");
        }
        pharmacyReceipt.recalculateTotals(receipt);
        return pharmacyReceipt.toResponse(stockReceiptRepository.save(receipt));
    }

    @Override
    public PharmacyStockReceiptResponse removeLine(UUID id, UUID lineId) {
        StockReceipt receipt = requireAccessibleDetailed(id);
        pharmacyReceipt.requireDraft(receipt);
        boolean removed = receipt.getLines().removeIf(line -> line.getId().equals(lineId));
        if (!removed) {
            throw PharmacyErrors.notFound("Receipt line");
        }
        pharmacyReceipt.recalculateTotals(receipt);
        return pharmacyReceipt.toResponse(stockReceiptRepository.save(receipt));
    }

    @Override
    public void deleteDraft(UUID id) {
        StockReceipt receipt = requireAccessibleDetailed(id);
        pharmacyReceipt.requireDraft(receipt);
        receipt.getLines().clear();
        stockReceiptRepository.delete(receipt);
    }

    @Override
    public PharmacyStockReceiptResponse activate(UUID id) {
        StockReceipt receipt = requireAccessibleDetailed(id);
        pharmacyReceipt.requireDraft(receipt);
        if (receipt.getLines().isEmpty()) {
            throw PharmacyErrors.badRequest("Cannot activate receipt without lines");
        }
        pharmacyReceipt.requireAllLinesHaveLots(receipt);

        for (StockReceiptLine line : receipt.getLines()) {
            Product product = line.getProduct();
            BigDecimal q = QuantityUtil.normalize(line.getQuantity());
            product.setCostPrice(line.getPurchasePrice());
            product.setSellingPrice(line.getUnitSellingPrice());
            if (line.getVatPercent() != null) {
                product.setTaxRate(line.getVatPercent());
            }
            storeStockService.increase(product, receipt.getStoreId(), q);
            stockLotRepository.save(StockLot.builder()
                .product(product)
                .storeId(receipt.getStoreId())
                .receiptLine(line)
                .batchNumber(line.getBatchNumber())
                .expiryDate(line.getExpiryDate())
                .quantity(q)
                .purchasePrice(line.getPurchasePrice())
                .unitSellingPrice(line.getUnitSellingPrice())
                .build());
        }

        receipt.setStatus(StockReceiptStatus.POSTED);
        receipt.setActivatedAt(Instant.now());
        receipt.setActivatedBy(tenant.currentUserId());
        stockReceiptRepository.save(receipt);
        return pharmacyReceipt.toResponse(stockReceiptRepository.findDetailedById(id).orElseThrow());
    }

    private StockReceiptLine buildValidatedLine(StockReceipt receipt, PharmacyStockReceiptLineRequest lineReq) {
        Product product = productCatalogService.requireActive(lineReq.productId());
        return pharmacyReceipt.buildLine(receipt, product, lineReq);
    }

    private StockReceipt requireAccessible(UUID id) {
        StockReceipt receipt = stockReceiptRepository.findById(id)
            .orElseThrow(() -> PharmacyErrors.notFound("Receipt"));
        if (!receipt.getCompanyId().equals(tenant.requireCompanyId())) {
            throw PharmacyErrors.badRequest("Access denied");
        }
        return receipt;
    }

    private StockReceipt requireAccessibleDetailed(UUID id) {
        StockReceipt receipt = stockReceiptRepository.findDetailedById(id)
            .orElseThrow(() -> PharmacyErrors.notFound("Receipt"));
        if (!receipt.getCompanyId().equals(tenant.requireCompanyId())) {
            throw PharmacyErrors.badRequest("Access denied");
        }
        return receipt;
    }

    private String nextReceiptNumber() {
        LocalDate today = LocalDate.now(ZONE);
        Instant dayStart = today.atStartOfDay(ZONE).toInstant();
        long seq = stockReceiptRepository.countByCreatedAtGreaterThanEqual(dayStart) + 1;
        return "REC-" + today.format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + String.format("%04d", seq);
    }

    private static void requireLines(List<PharmacyStockReceiptLineRequest> lines) {
        if (lines == null || lines.isEmpty()) {
            throw PharmacyErrors.badRequest("At least one line is required");
        }
    }

    private static String normalizePayment(String paymentType) {
        if (!StringUtils.hasText(paymentType)) {
            return "CASH";
        }
        String normalized = paymentType.trim().toUpperCase();
        if (!"CASH".equals(normalized) && !"CREDIT".equals(normalized)) {
            throw PharmacyErrors.badRequest("paymentType must be CASH or CREDIT");
        }
        return normalized;
    }
}
