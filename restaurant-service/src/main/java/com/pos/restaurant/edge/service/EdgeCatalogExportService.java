package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.CategoryRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.HallRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ItemRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ModifierGroupRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ModifierLinkRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ModifierOptionRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.KitchenTicketLineRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.KitchenTicketRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderItemModifierRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderItemRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderLinkRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OrderPaymentRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.RecipeLineRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.RecipeRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ShiftRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.StationRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.StoreSettingRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.TableRow;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.repository.FloorHallRepository;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.floor.revision.FloorRevisionStore;
import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.kitchen.entity.KitchenTicket;
import com.pos.restaurant.kitchen.repository.KitchenStationRepository;
import com.pos.restaurant.kitchen.repository.KitchenTicketLineRepository;
import com.pos.restaurant.kitchen.repository.KitchenTicketRepository;
import com.pos.restaurant.menu.repository.MenuCategoryRepository;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.modifier.entity.ModifierGroup;
import com.pos.restaurant.modifier.entity.ModifierOption;
import com.pos.restaurant.modifier.repository.MenuItemModifierLinkRepository;
import com.pos.restaurant.modifier.repository.ModifierGroupRepository;
import com.pos.restaurant.modifier.repository.ModifierOptionRepository;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.entity.FloorOrderTableLink;
import com.pos.restaurant.order.repository.FloorOrderItemModifierRepository;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.order.repository.FloorOrderTableLinkRepository;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.payment.repository.FloorOrderPaymentRepository;
import org.springframework.data.domain.PageRequest;
import com.pos.restaurant.recipe.entity.Recipe;
import com.pos.restaurant.recipe.repository.RecipeLineRepository;
import com.pos.restaurant.recipe.repository.RecipeRepository;
import com.pos.restaurant.security.RestaurantTenantContext;
import com.pos.restaurant.settings.repository.RestaurantStoreSettingRepository;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.repository.RestaurantShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EdgeCatalogExportService {

    private final FloorHallRepository hallRepository;
    private final FloorTableRepository tableRepository;
    private final KitchenStationRepository stationRepository;
    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository itemRepository;
    private final ModifierGroupRepository modifierGroupRepository;
    private final ModifierOptionRepository modifierOptionRepository;
    private final MenuItemModifierLinkRepository modifierLinkRepository;
    private final RestaurantStoreSettingRepository storeSettingRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeLineRepository recipeLineRepository;
    private final RestaurantShiftRepository shiftRepository;
    private final FloorOrderRepository floorOrderRepository;
    private final FloorOrderItemRepository floorOrderItemRepository;
    private final FloorOrderItemModifierRepository floorOrderItemModifierRepository;
    private final FloorOrderTableLinkRepository floorOrderTableLinkRepository;
    private final KitchenTicketRepository kitchenTicketRepository;
    private final KitchenTicketLineRepository kitchenTicketLineRepository;
    private final FloorOrderPaymentRepository floorOrderPaymentRepository;
    private final FloorRevisionStore floorRevisionStore;

    @Transactional(readOnly = true)
    public EdgeCatalogSnapshot export(Integer storeId, String companyLoginCode) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        if (companyId == null) {
            throw new BusinessException("Company context required");
        }
        if (storeId == null) {
            throw new BusinessException("storeId required");
        }

        List<HallRow> halls = hallRepository
            .findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId)
            .stream()
            .map(h -> new HallRow(h.getId(), h.getName(), h.getSortOrder(), h.isActive(), h.getServicePercent()))
            .toList();

        List<TableRow> tables = tableRepository
            .findByCompanyIdAndStoreIdOrderByHallAndCode(companyId, storeId)
            .stream()
            .map(t -> new TableRow(
                t.getId(),
                t.getHall().getId(),
                t.getCode(),
                t.getLabel(),
                t.getSeatCount(),
                t.getServicePercent(),
                t.getPosX(),
                t.getPosY(),
                t.getWidth(),
                t.getHeight(),
                t.getStatus() == null ? "FREE" : t.getStatus().name(),
                t.isActive()
            ))
            .toList();

        List<StationRow> stations = stationRepository
            .findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId)
            .stream()
            .map(s -> new StationRow(s.getId(), s.getCode(), s.getName(), s.getSortOrder(), s.isActive()))
            .toList();

        List<CategoryRow> categories = categoryRepository
            .findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId)
            .stream()
            .map(c -> new CategoryRow(
                c.getId(), c.getName(), c.getSortOrder(), c.isActive(),
                c.isAutoPrint(), c.getPrintPrinterName()
            ))
            .toList();

        List<ItemRow> items = itemRepository
            .findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId)
            .stream()
            .map(i -> new ItemRow(
                i.getId(),
                i.getItemType() == null ? "DISH" : i.getItemType().name(),
                i.getName(),
                i.getSku(),
                i.getPrice(),
                i.getTaxRate(),
                i.isActive(),
                i.isAvailable(),
                i.getStationId(),
                i.getCategory(),
                i.getMenuCategoryId(),
                i.getImageUrl(),
                i.getDescription(),
                i.getPrepMinutes(),
                i.getPortionGrams(),
                i.getPortionAmount(),
                i.getPortionUnit() == null ? null : i.getPortionUnit().name(),
                i.getPortionLabel(),
                i.getVariantGroupId(),
                i.getTags(),
                i.getIkpu(),
                i.getPackageCode(),
                i.getUnitOfMeasure(),
                i.getUnitMeasureCode(),
                i.getBarcode(),
                i.isMarkedProduct(),
                i.getSortOrder()
            ))
            .toList();

        List<ModifierGroup> groups = modifierGroupRepository
            .findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId);
        List<ModifierGroupRow> groupRows = groups.stream()
            .map(g -> new ModifierGroupRow(
                g.getId(), g.getName(),
                g.getGroupKind() == null ? "STANDARD" : g.getGroupKind().name(),
                g.getMinSelect(), g.getMaxSelect(), g.getSortOrder(),
                g.isAvailableForAll(), g.isActive()
            ))
            .toList();

        List<UUID> groupIds = groups.stream().map(ModifierGroup::getId).toList();
        List<ModifierOptionRow> optionRows = new ArrayList<>();
        for (UUID gid : groupIds) {
            for (ModifierOption o : modifierOptionRepository.findByGroupIdOrderBySortOrderAscNameAsc(gid)) {
                optionRows.add(new ModifierOptionRow(
                    o.getId(), gid, o.getName(), o.getPriceDelta(), o.getSortOrder(), o.isActive()
                ));
            }
        }

        List<UUID> itemIds = items.stream().map(ItemRow::id).toList();
        List<ModifierLinkRow> links = itemIds.isEmpty()
            ? List.of()
            : modifierLinkRepository.findByMenuItemIdIn(itemIds).stream()
                .map(l -> new ModifierLinkRow(l.getMenuItemId(), l.getGroupId()))
                .collect(Collectors.toList());

        StoreSettingRow setting = storeSettingRepository
            .findByCompanyIdAndStoreId(companyId, storeId)
            .map(s -> new StoreSettingRow(s.getId(), s.isKitchenBoardEnabled(), s.getPrintProfileJson()))
            .orElse(null);

        List<Recipe> recipes = recipeRepository.findByCompanyIdAndStoreId(companyId, storeId);
        List<RecipeRow> recipeRows = recipes.stream()
            .map(r -> new RecipeRow(
                r.getId(),
                r.getMenuItem() == null ? null : r.getMenuItem().getId(),
                r.getOutputQty()
            ))
            .toList();
        List<UUID> recipeIds = recipes.stream().map(Recipe::getId).toList();
        List<RecipeLineRow> recipeLineRows = recipeIds.isEmpty()
            ? List.of()
            : recipeLineRepository.findByRecipeIdIn(recipeIds).stream()
                .map(l -> new RecipeLineRow(
                    l.getId(),
                    l.getRecipe().getId(),
                    l.getProductId(),
                    l.getProductName(),
                    l.getUnit(),
                    l.getQtyGross(),
                    l.getWastePercent(),
                    l.getQtyNet(),
                    l.getSortOrder()
                ))
                .toList();

        ShiftRow openShift = shiftRepository
            .findByStoreIdAndStatus(storeId, RestaurantShiftStatus.OPEN)
            .filter(s -> companyId.equals(s.getCompanyId()))
            .map(s -> new ShiftRow(
                s.getId(),
                s.getStatus() == null ? "OPEN" : s.getStatus().name(),
                s.getOpenedByUserId(),
                s.getOpenedAt(),
                s.getOpeningCash(),
                s.getHandoverExpected(),
                s.getHandoverDiff(),
                s.getComment()
            ))
            .orElse(null);

        List<OrderStatus> liveStatuses = List.of(OrderStatus.OPEN, OrderStatus.BILLING);
        List<FloorOrder> allLive = floorOrderRepository
            .findLiveByCompanyIdAndStoreIdAndStatusIn(companyId, storeId, liveStatuses);
        List<OpenOrderRow> openOrders = allLive.stream().map(o -> new OpenOrderRow(
            o.getId(),
            o.getTable() == null ? null : o.getTable().getId(),
            o.getChannel() == null ? "DINE_IN" : o.getChannel().name(),
            o.getOrderNo(),
            o.getStatus() == null ? "OPEN" : o.getStatus().name(),
            o.getGuestCount(),
            o.getAdultCount(),
            o.getChildrenCount(),
            o.getClientName(),
            o.getClientPhone(),
            o.getDeliveryAddress(),
            o.getDeliveryStatus() == null ? null : o.getDeliveryStatus().name(),
            o.getOpenedByUserId(),
            o.getWaiterUserId(),
            o.getCourierUserId(),
            o.getCommissionPercent(),
            o.getCommissionBaseAmount(),
            o.getCommissionAmount(),
            o.getServicePercent(),
            o.getServiceAmount(),
            o.getDiscountAmount() == null ? java.math.BigDecimal.ZERO : o.getDiscountAmount(),
            o.getShift() == null ? null : o.getShift().getId(),
            o.getComment(),
            o.getOpenedAt(),
            o.getClosedAt(),
            o.getUpdatedAt(),
            o.getPickupNo()
        )).toList();

        List<UUID> liveIds = allLive.stream().map(FloorOrder::getId).toList();
        List<FloorOrderItem> liveItems = liveIds.isEmpty()
            ? List.of()
            : floorOrderItemRepository.findByOrderIdInOrdered(liveIds);
        List<OpenOrderItemRow> openOrderItems = liveItems.stream()
            .map(i -> new OpenOrderItemRow(
                i.getId(),
                i.getOrder().getId(),
                i.getMenuItem() == null ? null : i.getMenuItem().getId(),
                i.getName(),
                i.getQuantity(),
                i.getReturnedQuantity(),
                i.getSentQuantity(),
                i.getUnitPrice(),
                i.getTaxRate(),
                i.getStationId(),
                i.getNote(),
                i.getItemStatus() == null ? "NEW" : i.getItemStatus().name(),
                i.getSortOrder(),
                i.getCreatedAt(),
                i.getUpdatedAt()
            ))
            .toList();

        List<UUID> liveItemIds = liveItems.stream().map(FloorOrderItem::getId).toList();
        List<OpenOrderItemModifierRow> openOrderItemModifiers = liveItemIds.isEmpty()
            ? List.of()
            : floorOrderItemModifierRepository.findByOrderItemIdIn(liveItemIds).stream()
                .map(m -> new OpenOrderItemModifierRow(
                    m.getId(),
                    m.getOrderItem().getId(),
                    m.getOptionId(),
                    m.getName(),
                    m.getPriceDelta() == null ? java.math.BigDecimal.ZERO : m.getPriceDelta()
                ))
                .toList();

        List<OpenOrderLinkRow> openOrderLinks = new ArrayList<>();
        for (UUID oid : liveIds) {
            for (FloorOrderTableLink link : floorOrderTableLinkRepository.findByOrderId(oid)) {
                openOrderLinks.add(new OpenOrderLinkRow(
                    link.getId(),
                    oid,
                    link.getTable() == null ? null : link.getTable().getId(),
                    link.getLinkedAt(),
                    link.getLinkedByUserId()
                ));
            }
        }

        List<KitchenTicket> activeTickets = liveIds.isEmpty()
            ? List.of()
            : kitchenTicketRepository.findByOrderIdIn(liveIds).stream()
                .filter(t -> t.getStatus() != KitchenTicketStatus.SERVED
                    && t.getStatus() != KitchenTicketStatus.CANCELLED)
                .toList();
        List<KitchenTicketRow> kitchenTickets = activeTickets.stream()
            .map(t -> new KitchenTicketRow(
                t.getId(),
                t.getOrder() == null ? null : t.getOrder().getId(),
                t.getStation() == null ? null : t.getStation().getId(),
                t.getStatus() == null ? "NEW" : t.getStatus().name(),
                t.getSentAt(),
                t.getUpdatedAt()
            ))
            .toList();
        List<UUID> ticketIds = activeTickets.stream().map(KitchenTicket::getId).toList();
        List<KitchenTicketLineRow> kitchenTicketLines = ticketIds.isEmpty()
            ? List.of()
            : kitchenTicketLineRepository.findByTicketIdIn(ticketIds).stream()
                .map(l -> new KitchenTicketLineRow(
                    l.getId(),
                    l.getTicket().getId(),
                    l.getOrderItem() == null ? null : l.getOrderItem().getId(),
                    l.getQuantity()
                ))
                .toList();

        List<FloorOrder> recentClosed = floorOrderRepository.findRecentByCompanyIdAndStoreIdAndStatusIn(
            companyId, storeId, List.of(OrderStatus.CLOSED), PageRequest.of(0, 400)
        );
        List<OpenOrderRow> closedOrders = recentClosed.stream().map(o -> new OpenOrderRow(
            o.getId(),
            o.getTable() == null ? null : o.getTable().getId(),
            o.getChannel() == null ? "DINE_IN" : o.getChannel().name(),
            o.getOrderNo(),
            o.getStatus() == null ? "CLOSED" : o.getStatus().name(),
            o.getGuestCount(),
            o.getAdultCount(),
            o.getChildrenCount(),
            o.getClientName(),
            o.getClientPhone(),
            o.getDeliveryAddress(),
            o.getDeliveryStatus() == null ? null : o.getDeliveryStatus().name(),
            o.getOpenedByUserId(),
            o.getWaiterUserId(),
            o.getCourierUserId(),
            o.getCommissionPercent(),
            o.getCommissionBaseAmount(),
            o.getCommissionAmount(),
            o.getServicePercent(),
            o.getServiceAmount(),
            o.getDiscountAmount() == null ? java.math.BigDecimal.ZERO : o.getDiscountAmount(),
            o.getShift() == null ? null : o.getShift().getId(),
            o.getComment(),
            o.getOpenedAt(),
            o.getClosedAt(),
            o.getUpdatedAt(),
            o.getPickupNo()
        )).toList();
        List<UUID> closedIds = recentClosed.stream().map(FloorOrder::getId).toList();
        List<FloorOrderItem> closedItems = closedIds.isEmpty()
            ? List.of()
            : floorOrderItemRepository.findByOrderIdInOrdered(closedIds);
        List<OpenOrderItemRow> closedOrderItems = closedItems.stream()
            .map(i -> new OpenOrderItemRow(
                i.getId(),
                i.getOrder().getId(),
                i.getMenuItem() == null ? null : i.getMenuItem().getId(),
                i.getName(),
                i.getQuantity(),
                i.getReturnedQuantity(),
                i.getSentQuantity(),
                i.getUnitPrice(),
                i.getTaxRate(),
                i.getStationId(),
                i.getNote(),
                i.getItemStatus() == null ? "NEW" : i.getItemStatus().name(),
                i.getSortOrder(),
                i.getCreatedAt(),
                i.getUpdatedAt()
            ))
            .toList();
        List<UUID> closedItemIds = closedItems.stream().map(FloorOrderItem::getId).toList();
        List<OpenOrderItemModifierRow> closedOrderItemModifiers = closedItemIds.isEmpty()
            ? List.of()
            : floorOrderItemModifierRepository.findByOrderItemIdIn(closedItemIds).stream()
                .map(m -> new OpenOrderItemModifierRow(
                    m.getId(),
                    m.getOrderItem().getId(),
                    m.getOptionId(),
                    m.getName(),
                    m.getPriceDelta() == null ? java.math.BigDecimal.ZERO : m.getPriceDelta()
                ))
                .toList();

        List<UUID> paymentOrderIds = new ArrayList<>(liveIds);
        paymentOrderIds.addAll(closedIds);
        List<OrderPaymentRow> orderPayments = paymentOrderIds.isEmpty()
            ? List.of()
            : floorOrderPaymentRepository.findByOrder_IdIn(paymentOrderIds).stream()
                .map(EdgeCatalogExportService::toPaymentRow)
                .toList();

        return new EdgeCatalogSnapshot(
            companyId,
            storeId,
            companyLoginCode,
            halls,
            tables,
            stations,
            categories,
            items,
            groupRows,
            optionRows,
            links,
            setting,
            recipeRows,
            recipeLineRows,
            openShift,
            openOrders,
            openOrderItems,
            openOrderLinks,
            openOrderItemModifiers,
            kitchenTickets,
            kitchenTicketLines,
            closedOrders,
            closedOrderItems,
            closedOrderItemModifiers,
            orderPayments,
            floorRevisionStore.readOrigin(companyId, storeId)
        );
    }

    private static OrderPaymentRow toPaymentRow(FloorOrderPayment p) {
        return new OrderPaymentRow(
            p.getId(),
            p.getOrder() == null ? null : p.getOrder().getId(),
            p.getMethod() == null ? "CASH" : p.getMethod().name(),
            p.getAmount(),
            p.getCashAmount(),
            p.getCardAmount(),
            p.getAmountTendered(),
            p.getChangeGiven(),
            p.getCardType() == null ? null : p.getCardType().name(),
            p.getDebtPhone(),
            p.getDebtComment(),
            p.getAdvancePaid(),
            p.getDebtRemaining(),
            p.getPaidByUserId(),
            p.getPaidAt()
        );
    }
}
