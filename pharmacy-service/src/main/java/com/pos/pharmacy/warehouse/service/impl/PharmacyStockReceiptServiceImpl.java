package com.pos.pharmacy.warehouse.service.impl;

import com.pos.pharmacy.cache.PharmacyCatalogCacheEvictor;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.service.ProductCatalogService;
import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.PharmacyException;
import com.pos.pharmacy.exception.errorcode.PharmacyCommonErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyReceiptErrors;
import com.pos.pharmacy.exception.errorcode.PharmacySqlConstraintError;
import com.pos.pharmacy.warehouse.domain.PharmacyReceiptMassField;
import com.pos.pharmacy.warehouse.domain.StockReceiptStatus;
import com.pos.pharmacy.warehouse.dto.*;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import com.pos.pharmacy.warehouse.entity.Supplier;
import com.pos.pharmacy.warehouse.repository.StockReceiptRepository;
import com.pos.pharmacy.warehouse.repository.SupplierRepository;
import com.pos.pharmacy.warehouse.service.PharmacyStockReceiptService;
import com.pos.pharmacy.warehouse.support.PharmacyPaymentType;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptActivation;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptDeletion;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptLotDetach;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptMarkRegistration;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptMassApplier;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptNumberAllocator;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptPostedPriceGuard;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptPostedPriceSync;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptSupport;
import com.pos.pharmacy.warehouse.support.PharmacyMoneyLimit;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PharmacyStockReceiptServiceImpl implements PharmacyStockReceiptService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockReceiptRepository stockReceiptRepository;
    private final SupplierRepository supplierRepository;
    private final ProductCatalogService productCatalogService;
    private final PharmacyReceiptSupport pharmacyReceipt;
    private final PharmacyReceiptDeletion pharmacyReceiptDeletion;
    private final PharmacyReceiptActivation pharmacyReceiptActivation;
    private final PharmacyReceiptLotDetach pharmacyReceiptLotDetach;
    private final PharmacyReceiptMarkRegistration pharmacyReceiptMarkRegistration;
    private final PharmacyReceiptMassApplier pharmacyReceiptMassApplier;
    private final PharmacyReceiptPostedPriceSync postedPriceSync;
    private final PharmacyReceiptPostedPriceGuard postedPriceGuard;
    private final PharmacyReceiptNumberAllocator receiptNumberAllocator;
    private final TenantSupport tenant;
    private final PharmacyCatalogCacheEvictor catalogCacheEvictor;

    @Override
    public PharmacyStockReceiptResponse createDraft(CreatePharmacyStockReceiptRequest request) {
        Integer companyId = tenant.requireCompanyId();
        StockReceipt receipt = stockReceiptRepository.save(StockReceipt.builder()
            .companyId(companyId)
            .receiptNumber(receiptNumberAllocator.next())
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
            .paymentType(PharmacyPaymentType.normalize(request.paymentType()))
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
            receipt.setPaymentType(PharmacyPaymentType.normalize(request.paymentType()));
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
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_NO_LINES_TO_SAVE);
        }
        for (PharmacyStockReceiptLineRequest lineReq : lines) {
            receipt.getLines().add(buildValidatedLine(receipt, lineReq));
        }
        pharmacyReceipt.recalculateTotals(receipt);
        return pharmacyReceipt.toResponse(stockReceiptRepository.save(receipt));
    }

    @Override
    public void updateLine(UUID id, UUID lineId, PharmacyStockReceiptLineRequest lineReq) {
        StockReceipt receipt = requireAccessibleDetailed(id);
        StockReceiptLine existing = receipt.getLines().stream()
            .filter(line -> line.getId().equals(lineId))
            .findFirst()
            .orElseThrow(() -> PharmacyErrors.notFound(PharmacyReceiptErrors.PHARM_RECEIPT_LINE_NOT_FOUND));
        Product product;
        Map<UUID, BigDecimal> previousQuantities = Map.of();
        if (StockReceiptStatus.POSTED.equals(receipt.getStatus())) {
            product = existing.getProduct();
            if (product == null) {
                product = productCatalogService.requireActive(lineReq.productId());
            }
            if (existing.getId() != null && existing.getQuantity() != null) {
                previousQuantities = Map.of(existing.getId(), existing.getQuantity());
            }
            pharmacyReceipt.applyLine(existing, product, lineReq);
        } else {
            pharmacyReceipt.requireDraft(receipt);
            product = productCatalogService.requireActive(lineReq.productId());
            pharmacyReceipt.applyLine(existing, product, lineReq);
        }
        PharmacyMoneyLimit.requireFitsNumeric18_2(existing.getPurchasePrice(), "цена закупки");
        PharmacyMoneyLimit.requireFitsNumeric18_2(existing.getPurchasePriceWithVat(), "цена с НДС");
        PharmacyMoneyLimit.requireFitsNumeric18_2(existing.getRetailPrice(), "розничная цена");
        PharmacyMoneyLimit.requireFitsNumeric18_2(existing.getUnitSellingPrice(), "цена продажи");
        PharmacyMoneyLimit.requireFitsNumeric18_2(existing.getLineCost(), "сумма закупки");
        PharmacyMoneyLimit.requireFitsNumeric18_2(existing.getLineRetail(), "сумма розницы");
        pharmacyReceipt.recalculateTotals(receipt);
        stockReceiptRepository.save(receipt);
        postedPriceSync.sync(receipt, List.of(existing), previousQuantities);
    }

    @Override
    public PharmacyReceiptRevalueResult revalueLines(UUID id, PharmacyReceiptRevalueRequest request) {
        StockReceipt receipt = requireAccessibleDetailed(id);
        if (!StockReceiptStatus.POSTED.equals(receipt.getStatus())) {
            pharmacyReceipt.requireDraft(receipt);
        }
        if (request == null || (request.vatPercent() == null && request.markupPercent() == null)) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_REVALUE_PARAMS);
        }
        Set<UUID> selected = request.lineIds() == null || request.lineIds().isEmpty()
            ? null
            : new HashSet<>(request.lineIds());
        List<StockReceiptLine> changed = new ArrayList<>();
        for (StockReceiptLine line : receipt.getLines()) {
            if (selected != null && !selected.contains(line.getId())) {
                continue;
            }
            pharmacyReceipt.revalueLine(line, request.vatPercent(), request.markupPercent());
            changed.add(line);
        }
        if (changed.isEmpty()) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_NO_LINES_TO_REVALUE);
        }
        pharmacyReceipt.recalculateTotals(receipt);
        stockReceiptRepository.save(receipt);
        postedPriceSync.sync(receipt, changed);
        return new PharmacyReceiptRevalueResult(changed.size());
    }

    @Override
    public PharmacyReceiptRevalueResult massUpdateLines(UUID id, PharmacyReceiptMassUpdateRequest request) {
        StockReceipt receipt = requireAccessibleDetailed(id);
        if (request == null || request.field() == null) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_MASS_FIELD_REQUIRED);
        }
        postedPriceGuard.requireMassField(receipt, request.field());
        Set<UUID> selected = request.lineIds() == null || request.lineIds().isEmpty()
            ? null
            : new HashSet<>(request.lineIds());
        List<StockReceiptLine> changed = new ArrayList<>();
        Map<UUID, BigDecimal> previousQuantities = new HashMap<>();
        boolean trackQty = PharmacyReceiptMassField.QUANTITY.equals(request.field());
        for (StockReceiptLine line : receipt.getLines()) {
            if (selected != null && !selected.contains(line.getId())) {
                continue;
            }
            if (trackQty && line.getId() != null) {
                previousQuantities.put(line.getId(), line.getQuantity());
            }
            pharmacyReceiptMassApplier.apply(line, request.field(), request.value());
            changed.add(line);
        }
        if (changed.isEmpty()) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_NO_LINES_TO_UPDATE);
        }
        pharmacyReceipt.recalculateTotals(receipt);
        stockReceiptRepository.save(receipt);
        postedPriceSync.sync(receipt, changed, previousQuantities);
        return new PharmacyReceiptRevalueResult(changed.size());
    }

    @Override
    public PharmacyStockReceiptResponse removeLine(UUID id, UUID lineId) {
        StockReceipt receipt = requireAccessibleDetailed(id);
        pharmacyReceipt.requireDraft(receipt);
        pharmacyReceiptLotDetach.detachLotsForLines(receipt.getStoreId(), List.of(lineId));
        boolean removed = receipt.getLines().removeIf(line -> line.getId().equals(lineId));
        if (!removed) {
            throw PharmacyErrors.notFound(PharmacyReceiptErrors.PHARM_RECEIPT_LINE_NOT_FOUND);
        }
        pharmacyReceipt.recalculateTotals(receipt);
        return pharmacyReceipt.toResponse(stockReceiptRepository.save(receipt));
    }

    @Override
    public void deleteDraft(UUID id) {
        pharmacyReceiptDeletion.delete(requireAccessibleDetailed(id));
    }

    @Override
    public PharmacyReceiptActivateResult activate(UUID id) {
        return activate(id, null);
    }

    @Override
    public PharmacyReceiptActivateResult activate(UUID id, PharmacyReceiptActivateRequest request) {
        StockReceipt receipt = requireAccessibleDetailed(id);
        if (StockReceiptStatus.POSTED.equals(receipt.getStatus())) {
            return new PharmacyReceiptActivateResult(receipt.getStatus(), receipt.getReceiptNumber());
        }
        pharmacyReceipt.requireDraft(receipt);
        if (receipt.getLines().isEmpty()) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_ACTIVATE_EMPTY);
        }
        // КМ необязательны: регистрируем только переданные коды (IN_STOCK, не продажа).
        pharmacyReceiptMarkRegistration.validateMarkedProducts(
            receipt,
            request != null && request.marks() != null ? request.marks() : List.of()
        );
        pharmacyReceiptActivation.post(receipt);
        try {
            pharmacyReceiptMarkRegistration.registerAfterActivate(receipt, request);
        } catch (RuntimeException ex) {
            pharmacyReceiptLotDetach.detachLotsForLines(receipt.getStoreId(), lineIds(receipt));
            if (ex instanceof PharmacyException) {
                throw ex;
            }
            throw PharmacyErrors.of(PharmacySqlConstraintError.of(ex));
        }
        receipt.setStatus(StockReceiptStatus.POSTED);
        receipt.setActivatedAt(Instant.now());
        receipt.setActivatedBy(tenant.currentUserId());
        stockReceiptRepository.save(receipt);
        catalogCacheEvictor.onStoreStockChanged(receipt.getCompanyId(), receipt.getStoreId());
        return new PharmacyReceiptActivateResult(receipt.getStatus(), receipt.getReceiptNumber());
    }

    private StockReceiptLine buildValidatedLine(StockReceipt receipt, PharmacyStockReceiptLineRequest lineReq) {
        Product product = productCatalogService.requireActive(lineReq.productId());
        StockReceiptLine line = pharmacyReceipt.buildLine(receipt, product, lineReq);
        PharmacyMoneyLimit.requireFitsNumeric18_2(line.getPurchasePrice(), "цена закупки");
        PharmacyMoneyLimit.requireFitsNumeric18_2(line.getPurchasePriceWithVat(), "цена с НДС");
        PharmacyMoneyLimit.requireFitsNumeric18_2(line.getRetailPrice(), "розничная цена");
        PharmacyMoneyLimit.requireFitsNumeric18_2(line.getUnitSellingPrice(), "цена продажи");
        PharmacyMoneyLimit.requireFitsNumeric18_2(line.getLineCost(), "сумма закупки");
        PharmacyMoneyLimit.requireFitsNumeric18_2(line.getLineRetail(), "сумма розницы");
        return line;
    }

    private StockReceipt requireAccessible(UUID id) {
        StockReceipt receipt = stockReceiptRepository.findById(id)
            .orElseThrow(() -> PharmacyErrors.notFound(PharmacyReceiptErrors.PHARM_RECEIPT_NOT_FOUND));
        if (!receipt.getCompanyId().equals(tenant.requireCompanyId())) {
            throw PharmacyErrors.of(PharmacyCommonErrors.PHARM_ACCESS_DENIED);
        }
        return receipt;
    }

    private StockReceipt requireAccessibleDetailed(UUID id) {
        StockReceipt receipt = stockReceiptRepository.findDetailedById(id)
            .orElseThrow(() -> PharmacyErrors.notFound(PharmacyReceiptErrors.PHARM_RECEIPT_NOT_FOUND));
        if (!receipt.getCompanyId().equals(tenant.requireCompanyId())) {
            throw PharmacyErrors.of(PharmacyCommonErrors.PHARM_ACCESS_DENIED);
        }
        return receipt;
    }

    private static void requireLines(List<PharmacyStockReceiptLineRequest> lines) {
        if (lines == null || lines.isEmpty()) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_EMPTY);
        }
    }

    private static List<UUID> lineIds(StockReceipt receipt) {
        return receipt.getLines().stream()
            .map(StockReceiptLine::getId)
            .filter(id -> id != null)
            .toList();
    }

}
