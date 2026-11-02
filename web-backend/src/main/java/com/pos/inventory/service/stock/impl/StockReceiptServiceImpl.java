package com.pos.inventory.service.stock.impl;

import com.pos.dto.shared.PageResponse;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.integrations.finance.service.FinancePurchaseIntegrationService;
import com.pos.inventory.domain.StockReceiptStatus;
import com.pos.inventory.dto.warehouse.CreateStockReceiptRequest;
import com.pos.inventory.dto.warehouse.StockReceiptLineResponse;
import com.pos.inventory.dto.warehouse.StockReceiptResponse;
import com.pos.inventory.dto.warehouse.UpdateStockReceiptRequest;
import com.pos.inventory.entity.StockReceipt;
import com.pos.inventory.entity.Supplier;
import com.pos.inventory.repository.StockReceiptRepository;
import com.pos.inventory.repository.SupplierRepository;
import com.pos.inventory.service.stock.StockReceiptService;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.inventory.service.stock.support.StockDocumentSupport;
import com.pos.inventory.service.stock.support.StockReceiptMutationSupport;
import com.pos.security.CurrentUserProvider;
import com.pos.service.event.PosDomainEventService;
import com.pos.service.support.CatalogIsolationSupport;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
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
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class StockReceiptServiceImpl implements StockReceiptService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockReceiptRepository stockReceiptRepository;
    private final SupplierRepository supplierRepository;
    private final StoreStockService storeStockService;
    private final TenantAccessSupport tenantAccess;
    private final CurrentUserProvider currentUserProvider;
    private final StockDocumentSupport stockDocument;
    private final CatalogIsolationSupport catalogIsolation;
    private final FinancePurchaseIntegrationService financePurchaseIntegrationService;
    private final PosDomainEventService posDomainEventService;
    private final StockReceiptMutationSupport mutationSupport;

    @Override
    public StockReceiptResponse create(CreateStockReceiptRequest request) {
        stockDocument.requireLines(request.lines());
        User user = currentUserProvider.requireCurrentUser();
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        stockDocument.requireCompanyContext(companyId);
        Store store = storeStockService.requireStoreForCompany(companyId, request.storeId());
        catalogIsolation.rejectPharmacyStoreOnGrocery(store);
        Supplier supplier = resolveSupplier(request.supplierId());

        StockReceipt receipt = stockReceiptRepository.save(StockReceipt.builder()
            .receiptNumber(nextReceiptNumber())
            .status(StockReceiptStatus.POSTED)
            .documentDate(LocalDate.now(ZONE))
            .paymentType(request.paymentType())
            .supplier(supplier)
            .store(store)
            .notes(trimToNull(request.notes()))
            .createdBy(user)
            .totalQuantity(BigDecimal.ZERO)
            .totalCost(BigDecimal.ZERO)
            .totalRetail(BigDecimal.ZERO)
            .build());

        mutationSupport.applyLines(receipt, store, user, request.lines());
        stockReceiptRepository.save(receipt);
        financePurchaseIntegrationService.onPurchaseCompleted(receipt, request.paymentType());
        posDomainEventService.publishStockReceivedAfterCommit(receipt);

        return toResponse(stockReceiptRepository.findDetailedById(receipt.getId()).orElseThrow());
    }

    @Override
    public StockReceiptResponse update(UUID id, UpdateStockReceiptRequest request) {
        stockDocument.requireLines(request.lines());
        StockReceipt receipt = requireAccessibleReceipt(id);
        User user = currentUserProvider.requireCurrentUser();
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        stockDocument.requireCompanyContext(companyId);

        Integer storeId = request.storeId() != null
            ? request.storeId()
            : (receipt.getStore() != null ? receipt.getStore().getId() : null);
        Store store = storeStockService.requireStoreForCompany(companyId, storeId);
        catalogIsolation.rejectPharmacyStoreOnGrocery(store);

        mutationSupport.reverseStockAndMovements(receipt);
        receipt.setSupplier(resolveSupplier(request.supplierId()));
        receipt.setStore(store);
        receipt.setNotes(trimToNull(request.notes()));
        if (StringUtils.hasText(request.paymentType())) {
            receipt.setPaymentType(request.paymentType().trim());
        }
        mutationSupport.applyLines(receipt, store, user, request.lines());
        stockReceiptRepository.save(receipt);
        posDomainEventService.publishStockReceivedAfterCommit(receipt);
        LogUtil.info(
            StockReceiptServiceImpl.class,
            "Receipt updated (finance entries not rewritten): id={} number={}",
            receipt.getId(),
            receipt.getReceiptNumber()
        );
        return toResponse(stockReceiptRepository.findDetailedById(receipt.getId()).orElseThrow());
    }

    @Override
    public void delete(UUID id) {
        StockReceipt receipt = requireAccessibleReceipt(id);
        String number = receipt.getReceiptNumber();
        mutationSupport.reverseStockAndMovements(receipt);
        stockReceiptRepository.delete(receipt);
        LogUtil.warn(
            StockReceiptServiceImpl.class,
            "Receipt deleted; finance expense/payable for receipt may remain: id={} number={}",
            id,
            number
        );
    }

    @Override
    @Transactional(readOnly = true)
    public StockReceiptResponse getById(UUID id) {
        return toResponse(requireAccessibleReceipt(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockReceiptResponse> list(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    ) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Page<StockReceipt> page = stockReceiptRepository.findReceiptsBetween(
            start, end, storeId, companyId, pageable
        );
        return PageResponse.from(page.map(this::toSummary));
    }

    private StockReceipt requireAccessibleReceipt(UUID id) {
        StockReceipt receipt = stockReceiptRepository.findDetailedById(id)
            .orElseThrow(() -> PosExceptions.notFound("Receipt"));
        if (receipt.getStore() != null) {
            tenantAccess.assertCanAccessStore(receipt.getStore());
        }
        return receipt;
    }

    private String nextReceiptNumber() {
        LocalDate today = LocalDate.now(ZONE);
        Instant dayStart = today.atStartOfDay(ZONE).toInstant();
        long seq = stockReceiptRepository.countByCreatedAtGreaterThanEqual(dayStart) + 1;
        String datePart = today.format(DateTimeFormatter.BASIC_ISO_DATE);
        return "REC-" + datePart + "-" + String.format("%04d", seq);
    }

    private Supplier resolveSupplier(UUID supplierId) {
        if (supplierId == null) {
            return null;
        }
        return supplierRepository.findById(supplierId)
            .orElseThrow(() -> PosExceptions.notFound("Supplier"));
    }

    private String trimToNull(String s) {
        if (!StringUtils.hasText(s)) {
            return null;
        }
        return s.trim();
    }

    private StockReceiptResponse toSummary(StockReceipt r) {
        return new StockReceiptResponse(
            r.getId(),
            r.getReceiptNumber(),
            r.getSupplier() != null ? r.getSupplier().getId() : null,
            r.getSupplier() != null ? r.getSupplier().getName() : null,
            r.getStore() != null ? r.getStore().getId() : null,
            r.getStore() != null ? r.getStore().getName() : null,
            r.getNotes(),
            r.getTotalQuantity(),
            r.getTotalCost(),
            r.getCreatedBy() != null ? r.getCreatedBy().getFullName() : null,
            r.getCreatedAt(),
            List.of()
        );
    }

    private StockReceiptResponse toResponse(StockReceipt r) {
        List<StockReceiptLineResponse> lines = r.getLines().stream()
            .map(l -> new StockReceiptLineResponse(
                l.getId(),
                l.getProductId(),
                l.getProductName(),
                l.getProductSku(),
                l.getQuantity(),
                l.getPurchasePrice(),
                l.getUnitSellingPrice(),
                l.getLineCost()
            ))
            .toList();
        return new StockReceiptResponse(
            r.getId(),
            r.getReceiptNumber(),
            r.getSupplier() != null ? r.getSupplier().getId() : null,
            r.getSupplier() != null ? r.getSupplier().getName() : null,
            r.getStore() != null ? r.getStore().getId() : null,
            r.getStore() != null ? r.getStore().getName() : null,
            r.getNotes(),
            r.getTotalQuantity(),
            r.getTotalCost(),
            r.getCreatedBy() != null ? r.getCreatedBy().getFullName() : null,
            r.getCreatedAt(),
            lines
        );
    }
}
