package com.pos.inventory.service.stock.impl;

import com.pos.domain.ExpenseReason;
import com.pos.domain.StockMovementType;
import com.pos.dto.shared.PageResponse;
import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.inventory.dto.warehouse.CreateStockExpenseRequest;
import com.pos.inventory.dto.warehouse.StockExpenseLineRequest;
import com.pos.inventory.dto.warehouse.StockExpenseLineResponse;
import com.pos.inventory.dto.warehouse.StockExpenseResponse;
import com.pos.inventory.entity.StockExpense;
import com.pos.inventory.entity.StockExpenseLine;
import com.pos.inventory.entity.StockMovement;
import com.pos.inventory.repository.StockExpenseRepository;
import com.pos.inventory.service.stock.StockExpenseService;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.inventory.service.stock.support.StockDocumentSupport;
import com.pos.inventory.service.stock.support.StockMovementPersistence;
import com.pos.security.CurrentUserProvider;
import com.pos.service.support.CatalogIsolationSupport;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.QuantityUtil;
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
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class StockExpenseServiceImpl implements StockExpenseService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockExpenseRepository stockExpenseRepository;
    private final ProductRepository productRepository;
    private final StockMovementPersistence stockMovementPersistence;
    private final StoreStockService storeStockService;
    private final CurrentUserProvider currentUserProvider;
    private final TenantAccessSupport tenantAccess;
    private final StockDocumentSupport stockDocument;
    private final CatalogIsolationSupport catalogIsolation;

    @Override
    public StockExpenseResponse create(CreateStockExpenseRequest request) {
        stockDocument.requireLines(request.lines());
        User user = currentUserProvider.requireCurrentUser();
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        stockDocument.requireCompanyContext(companyId);
        Store store = storeStockService.requireStoreForCompany(companyId, request.storeId());
        catalogIsolation.rejectPharmacyStoreOnGrocery(store);

        ExpenseReason reason;
        try {
            reason = ExpenseReason.parse(request.reason());
        } catch (IllegalArgumentException ex) {
            throw PosExceptions.badRequest(ex.getMessage());
        }

        String number = nextExpenseNumber();
        StockExpense expense = stockExpenseRepository.save(StockExpense.builder()
            .expenseNumber(number)
            .store(store)
            .reason(reason.name())
            .recipient(trimToNull(request.recipient()))
            .notes(trimToNull(request.notes()))
            .createdBy(user)
            .totalQuantity(BigDecimal.ZERO)
            .build());
        UUID expenseId = expense.getId();

        BigDecimal totalQty = BigDecimal.ZERO;
        List<StockExpenseLine> lines = new ArrayList<>();

        for (StockExpenseLineRequest lineReq : request.lines()) {
            Product product = stockDocument.requireActiveGroceryProduct(lineReq.productId());
            BigDecimal q = QuantityUtil.normalize(lineReq.quantity());
            stockDocument.requirePositiveQuantity(q);
            com.pos.util.QuantityValidator.validate(product, q);
            storeStockService.requireAvailable(product, store, q);
            storeStockService.decrease(product, store, q);
            productRepository.save(product);

            lines.add(StockExpenseLine.builder()
                .expense(expense)
                .product(product)
                .quantity(q)
                .build());

            String notes = buildNotes(number, reason, request.recipient(), request.notes());
            stockMovementPersistence.save(StockMovement.builder()
                .product(product)
                .store(store)
                .movementType(StockMovementType.EXPENSE)
                .writeOffReason(reason.name())
                .quantity(q.negate())
                .referenceId(expenseId)
                .notes(notes)
                .createdBy(user)
                .build(), number);

            totalQty = QuantityUtil.add(totalQty, q);
        }

        expense.getLines().clear();
        expense.getLines().addAll(lines);
        expense.setTotalQuantity(totalQty);
        stockExpenseRepository.save(expense);

        return toResponse(stockExpenseRepository.findDetailedById(expenseId).orElseThrow());
    }

    @Override
    @Transactional(readOnly = true)
    public StockExpenseResponse getById(UUID id) {
        StockExpense expense = stockExpenseRepository.findDetailedById(id)
            .orElseThrow(() -> PosExceptions.notFound("Expense"));
        tenantAccess.assertCanAccessStore(expense.getStore());
        return toResponse(expense);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockExpenseResponse> list(LocalDate from, LocalDate to, Integer storeId, Pageable pageable) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Page<StockExpense> page = stockExpenseRepository.findBetween(companyId, start, end, storeId, pageable);
        return PageResponse.from(page.map(this::toSummary));
    }

    private String nextExpenseNumber() {
        LocalDate today = LocalDate.now(ZONE);
        Instant dayStart = today.atStartOfDay(ZONE).toInstant();
        long seq = stockExpenseRepository.countByCreatedAtGreaterThanEqual(dayStart) + 1;
        return "EXP-" + today.format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + String.format("%04d", seq);
    }

    private static String buildNotes(String number, ExpenseReason reason, String recipient, String notes) {
        StringBuilder sb = new StringBuilder("Расход ").append(number).append(" · ").append(reason.name());
        if (StringUtils.hasText(recipient)) {
            sb.append(" · ").append(recipient.trim());
        }
        if (StringUtils.hasText(notes)) {
            sb.append(" · ").append(notes.trim());
        }
        return sb.toString();
    }

    private String trimToNull(String s) {
        if (!StringUtils.hasText(s)) {
            return null;
        }
        return s.trim();
    }

    private StockExpenseResponse toSummary(StockExpense e) {
        return new StockExpenseResponse(
            e.getId(),
            e.getExpenseNumber(),
            e.getStore().getId(),
            e.getStore().getName(),
            e.getReason(),
            e.getRecipient(),
            e.getNotes(),
            e.getTotalQuantity(),
            e.getCreatedBy() != null ? e.getCreatedBy().getFullName() : null,
            e.getCreatedAt(),
            List.of()
        );
    }

    private StockExpenseResponse toResponse(StockExpense e) {
        List<StockExpenseLineResponse> lines = e.getLines().stream()
            .map(l -> new StockExpenseLineResponse(
                l.getId(),
                l.getProduct().getId(),
                l.getProduct().getName(),
                l.getProduct().getSku(),
                l.getQuantity()
            ))
            .toList();
        return new StockExpenseResponse(
            e.getId(),
            e.getExpenseNumber(),
            e.getStore().getId(),
            e.getStore().getName(),
            e.getReason(),
            e.getRecipient(),
            e.getNotes(),
            e.getTotalQuantity(),
            e.getCreatedBy() != null ? e.getCreatedBy().getFullName() : null,
            e.getCreatedAt(),
            lines
        );
    }
}
