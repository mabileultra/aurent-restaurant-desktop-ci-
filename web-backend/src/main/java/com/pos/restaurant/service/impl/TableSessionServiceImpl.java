package com.pos.restaurant.service.impl;

import com.pos.domain.sale.ServiceMode;
import com.pos.sales.dto.sale.CreateSaleRequest;
import com.pos.sales.dto.sale.SaleItemRequest;
import com.pos.sales.dto.sale.SaleResponse;
import com.pos.catalog.entity.Product;
import com.pos.sales.entity.Sale;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.catalog.repository.ProductRepository;
import com.pos.sales.repository.SaleRepository;
import com.pos.repository.UserRepository;
import com.pos.restaurant.domain.DiningTableStatus;
import com.pos.restaurant.domain.TableSessionStatus;
import com.pos.restaurant.dto.AddTableSessionLineRequest;
import com.pos.restaurant.dto.AssignWaiterRequest;
import com.pos.restaurant.dto.OpenTableSessionRequest;
import com.pos.restaurant.dto.TableSessionCheckoutPreviewResponse;
import com.pos.restaurant.dto.TableSessionCheckoutRequest;
import com.pos.restaurant.dto.TableSessionLineResponse;
import com.pos.restaurant.dto.TableSessionResponse;
import com.pos.restaurant.dto.UpdateTableSessionLineRequest;
import com.pos.restaurant.entity.DiningTable;
import com.pos.restaurant.entity.TableSession;
import com.pos.restaurant.entity.TableSessionLine;
import com.pos.restaurant.repository.DiningTableRepository;
import com.pos.restaurant.repository.TableSessionLineRepository;
import com.pos.restaurant.repository.TableSessionRepository;
import com.pos.restaurant.service.TableSessionService;
import com.pos.restaurant.support.RestaurantStoreSupport;
import com.pos.restaurant.support.TableSessionMapper;
import com.pos.security.CurrentUserProvider;
import com.pos.security.RoleName;
import com.pos.sales.service.sale.SaleCheckoutService;
import com.pos.service.support.CashierSaleSupport;
import com.pos.shared.log.LogUtil;
import com.pos.util.MoneyCalculator;
import com.pos.util.QuantityValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TableSessionServiceImpl implements TableSessionService {

    private final TableSessionRepository sessionRepository;
    private final TableSessionLineRepository lineRepository;
    private final DiningTableRepository tableRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SaleRepository saleRepository;
    private final RestaurantStoreSupport storeSupport;
    private final CashierSaleSupport cashierSaleSupport;
    private final SaleCheckoutService saleCheckoutService;
    private final TableSessionMapper sessionMapper;
    private final CurrentUserProvider currentUserProvider;

    @Override
    public TableSessionResponse openSession(Integer tableId, OpenTableSessionRequest request) {
        DiningTable table = requireActiveTable(tableId);
        Store store = storeSupport.requireRestaurantStore(table.getHall().getStore().getId());
        if (sessionRepository.findByTableIdAndStatus(tableId, TableSessionStatus.OPEN).isPresent()) {
            throw new BadRequestException("Table already has an open session");
        }
        User currentUser = currentUserProvider.requireCurrentUser();
        User waiter = resolveWaiter(request.waiterUserId(), currentUser);
        TableSession session = TableSession.builder()
            .table(table)
            .store(store)
            .company(store.getCompany())
            .openedBy(currentUser)
            .waiter(waiter)
            .guestCount(request.guestCount())
            .status(TableSessionStatus.OPEN)
            .notes(request.notes())
            .build();
        TableSession saved = sessionRepository.save(session);
        table.setStatus(DiningTableStatus.OCCUPIED);
        tableRepository.save(table);
        LogUtil.info(TableSessionServiceImpl.class, "Table session opened: id={}, tableId={}", saved.getId(), tableId);
        return sessionMapper.toResponse(saved, List.of());
    }

    @Override
    @Transactional(readOnly = true)
    public TableSessionResponse getSession(UUID sessionId) {
        TableSession session = requireOpenSession(sessionId);
        List<TableSessionLine> lines = lineRepository.findBySessionIdOrderBySortOrderAscCreatedAtAsc(sessionId);
        return sessionMapper.toResponse(session, lines);
    }

    @Override
    public TableSessionResponse addLine(UUID sessionId, AddTableSessionLineRequest request) {
        TableSession session = requireMutableSession(sessionId);
        Product product = productRepository.findById(request.productId())
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        BigDecimal quantity = QuantityValidator.normalizeForProduct(product, request.quantity());
        QuantityValidator.validate(product, quantity);
        BigDecimal unitPrice = cashierSaleSupport.resolveUnitPrice(product, session.getStore().getId());
        int nextSort = lineRepository.findBySessionIdOrderBySortOrderAscCreatedAtAsc(sessionId).size();
        TableSessionLine line = TableSessionLine.builder()
            .session(session)
            .product(product)
            .quantity(quantity)
            .unitPrice(unitPrice)
            .note(request.note())
            .sortOrder(nextSort)
            .build();
        lineRepository.save(line);
        return reloadSession(sessionId);
    }

    @Override
    public TableSessionResponse updateLine(UUID sessionId, UUID lineId, UpdateTableSessionLineRequest request) {
        TableSession session = requireMutableSession(sessionId);
        TableSessionLine line = lineRepository.findByIdAndSessionId(lineId, sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session line not found"));
        BigDecimal quantity = QuantityValidator.normalizeForProduct(line.getProduct(), request.quantity());
        QuantityValidator.validate(line.getProduct(), quantity);
        line.setQuantity(quantity);
        line.setNote(request.note());
        lineRepository.save(line);
        return reloadSession(session.getId());
    }

    @Override
    public TableSessionResponse removeLine(UUID sessionId, UUID lineId) {
        requireMutableSession(sessionId);
        TableSessionLine line = lineRepository.findByIdAndSessionId(lineId, sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session line not found"));
        lineRepository.delete(line);
        return reloadSession(sessionId);
    }

    @Override
    public TableSessionResponse assignWaiter(UUID sessionId, AssignWaiterRequest request) {
        TableSession session = requireMutableSession(sessionId);
        User waiter = userRepository.findByIdWithDetails(request.waiterUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Waiter not found"));
        session.setWaiter(waiter);
        sessionRepository.save(session);
        return reloadSession(sessionId);
    }

    @Override
    @Transactional(readOnly = true)
    public TableSessionCheckoutPreviewResponse buildCheckoutPreview(UUID sessionId) {
        TableSession session = requireOpenSession(sessionId);
        List<TableSessionLine> lines = lineRepository.findBySessionIdOrderBySortOrderAscCreatedAtAsc(sessionId);
        List<TableSessionLineResponse> lineResponses = sessionMapper.toLineResponses(lines);
        BigDecimal subtotal = sessionMapper.calculateSubtotal(lines);
        return new TableSessionCheckoutPreviewResponse(
            session.getId(),
            session.getTable().getId(),
            session.getTable().getCode(),
            subtotal,
            BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
            subtotal,
            lineResponses
        );
    }

    @Override
    public SaleResponse checkout(UUID sessionId, TableSessionCheckoutRequest request) {
        TableSession session = requireOpenSession(sessionId);
        List<TableSessionLine> lines = lineRepository.findBySessionIdOrderBySortOrderAscCreatedAtAsc(sessionId);
        if (lines.isEmpty()) {
            throw new BadRequestException("Cannot checkout empty table session");
        }
        List<SaleItemRequest> saleItems = new ArrayList<>();
        for (TableSessionLine line : lines) {
            BigDecimal discountPercent = line.getLineDiscountPercent() != null
                ? line.getLineDiscountPercent()
                : BigDecimal.ZERO;
            BigDecimal grossBefore = MoneyCalculator.lineGrossBeforeDiscount(line.getUnitPrice(), line.getQuantity());
            BigDecimal discountAmount = grossBefore.multiply(discountPercent)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            saleItems.add(new SaleItemRequest(
                line.getProduct().getId(),
                line.getQuantity(),
                discountAmount,
                line.getUnitPrice()
            ));
        }
        String notes = request.notes() != null ? request.notes()
            : "Стол " + session.getTable().getCode();
        CreateSaleRequest saleRequest = new CreateSaleRequest(
            saleItems,
            request.paymentMethod(),
            session.getStore().getId(),
            request.cashAmount(),
            request.cardAmount(),
            request.amountTendered(),
            notes,
            request.customerId(),
            request.receiptType(),
            request.cardType(),
            request.orderDiscountAmount(),
            request.orderDiscountPercent(),
            request.advanceAmount(),
            null
        );
        User cashier = currentUserProvider.requireCurrentUser();
        SaleResponse saleResponse = saleCheckoutService.processSale(saleRequest, cashier.getId());
        Sale sale = saleRepository.findById(saleResponse.id())
            .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
        sale.setTableSessionId(sessionId);
        sale.setServiceMode(ServiceMode.TABLE);
        saleRepository.save(sale);

        session.setStatus(TableSessionStatus.CLOSED);
        session.setSale(sale);
        session.setClosedAt(Instant.now());
        sessionRepository.save(session);

        DiningTable table = session.getTable();
        table.setStatus(DiningTableStatus.FREE);
        tableRepository.save(table);

        LogUtil.info(TableSessionServiceImpl.class, "Table session checked out: sessionId={}, saleId={}",
            sessionId, sale.getId());
        return saleResponse;
    }

    @Override
    public void cancelSession(UUID sessionId) {
        User actor = currentUserProvider.requireCurrentUser();
        if (!RoleName.MANAGER.matches(actor) && !RoleName.TENANT_ADMIN.matches(actor)) {
            throw new BadRequestException("Only manager can cancel table session");
        }
        TableSession session = requireOpenSession(sessionId);
        session.setStatus(TableSessionStatus.CANCELLED);
        session.setClosedAt(Instant.now());
        sessionRepository.save(session);
        DiningTable table = session.getTable();
        table.setStatus(DiningTableStatus.FREE);
        tableRepository.save(table);
        LogUtil.info(TableSessionServiceImpl.class, "Table session cancelled: id={}", sessionId);
    }

    private TableSessionResponse reloadSession(UUID sessionId) {
        TableSession session = requireOpenSession(sessionId);
        List<TableSessionLine> lines = lineRepository.findBySessionIdOrderBySortOrderAscCreatedAtAsc(sessionId);
        return sessionMapper.toResponse(session, lines);
    }

    private DiningTable requireActiveTable(Integer tableId) {
        DiningTable table = tableRepository.findWithHallById(tableId)
            .orElseThrow(() -> new ResourceNotFoundException("Table not found"));
        if (!table.isActive()) {
            throw new BadRequestException("Table is inactive");
        }
        storeSupport.requireRestaurantStore(table.getHall().getStore().getId());
        return table;
    }

    private TableSession requireOpenSession(UUID sessionId) {
        TableSession session = sessionRepository.findWithDetailsById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Table session not found"));
        storeSupport.requireRestaurantStore(session.getStore().getId());
        return session;
    }

    private TableSession requireMutableSession(UUID sessionId) {
        TableSession session = requireOpenSession(sessionId);
        if (session.getStatus() != TableSessionStatus.OPEN) {
            throw new BadRequestException("Session is not open");
        }
        return session;
    }

    private User resolveWaiter(UUID waiterUserId, User fallback) {
        if (waiterUserId == null) {
            return fallback;
        }
        return userRepository.findByIdWithDetails(waiterUserId)
            .orElseThrow(() -> new ResourceNotFoundException("Waiter not found"));
    }
}
