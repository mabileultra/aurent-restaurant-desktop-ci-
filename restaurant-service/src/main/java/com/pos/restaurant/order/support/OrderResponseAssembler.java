package com.pos.restaurant.order.support;

import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.kitchen.entity.KitchenStation;
import com.pos.restaurant.kitchen.repository.KitchenStationRepository;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.support.MenuPortionFormat;
import com.pos.restaurant.menu.support.MenuVariantFiscalLookup;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.dto.LinkedTableResponse;
import com.pos.restaurant.order.dto.OrderItemModifierResponse;
import com.pos.restaurant.order.dto.OrderItemResponse;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.WaiterHistoryEntryResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.entity.FloorOrderItemModifier;
import com.pos.restaurant.order.entity.FloorOrderWaiterHistory;
import com.pos.restaurant.order.repository.FloorOrderItemModifierRepository;
import com.pos.restaurant.order.repository.FloorOrderWaiterHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OrderResponseAssembler {

    private final FloorOrderItemModifierRepository modifierRepository;
    private final FloorOrderWaiterHistoryRepository waiterHistoryRepository;
    private final KitchenStationRepository stationRepository;
    private final OrderTotals orderTotals;
    private final MenuVariantFiscalLookup variantFiscalLookup;

    public OrderResponse toResponse(FloorOrder order, List<FloorOrderItem> items) {
        return toResponse(order, items, List.of());
    }

    /**
     * Lightweight card for counter boards — totals + linesCount only, no per-line / history queries.
     */
    public OrderResponse toBoardCard(FloorOrder order, List<FloorOrderItem> items) {
        OrderChannel channel = order.getChannel() == null ? OrderChannel.DINE_IN : order.getChannel();
        Integer tableId = order.getTable() == null ? null : order.getTable().getId();
        String tableCode = order.getTable() == null ? displayCode(channel, order) : order.getTable().getCode();
        return new OrderResponse(
            order.getId(),
            order.getOrderNo(),
            channel,
            tableId,
            tableCode,
            order.getStoreId(),
            order.getStatus(),
            order.getDeliveryStatus(),
            order.getGuestCount(),
            order.getAdultCount(),
            order.getChildrenCount(),
            order.getClientName(),
            order.getClientPhone(),
            order.getDeliveryAddress(),
            order.getOpenedByUserId(),
            order.getWaiterUserId(),
            order.getCourierUserId(),
            order.getComment(),
            order.getOpenedAt(),
            order.getClosedAt(),
            orderTotals.billable(items),
            order.getCommissionPercent(),
            order.getCommissionBaseAmount(),
            order.getCommissionAmount(),
            order.getDiscountAmount() == null ? BigDecimal.ZERO : order.getDiscountAmount(),
            order.getServicePercent(),
            order.getServiceAmount(),
            items.size(),
            List.of(),
            List.of(),
            List.of(),
            order.getPickupNo()
        );
    }

    public OrderResponse toResponse(FloorOrder order, List<FloorOrderItem> items, List<FloorTable> linkedTables) {
        Map<UUID, List<FloorOrderItemModifier>> modifiers = items.isEmpty()
            ? Map.of()
            : modifierRepository.findByOrderItemIdIn(items.stream().map(FloorOrderItem::getId).toList()).stream()
                .collect(Collectors.groupingBy(mod -> mod.getOrderItem().getId()));
        Map<UUID, String> stationNames = stationNamesFor(order.getCompanyId(), items);
        Map<UUID, MenuVariantFiscalLookup.FiscalFields> fiscalDonors = variantFiscalLookup.donorsByGroup(
            order.getCompanyId(),
            items.stream().map(FloorOrderItem::getMenuItem).filter(Objects::nonNull).toList()
        );
        List<OrderItemResponse> itemResponses = items.stream()
            .map(item -> toItem(
                item,
                modifiers.getOrDefault(item.getId(), List.of()),
                stationNames,
                fiscalDonors
            ))
            .toList();
        OrderChannel channel = order.getChannel() == null ? OrderChannel.DINE_IN : order.getChannel();
        Integer tableId = order.getTable() == null ? null : order.getTable().getId();
        String tableCode = order.getTable() == null ? displayCode(channel, order) : order.getTable().getCode();
        Integer primaryTableId = tableId;
        List<LinkedTableResponse> linked = linkedTables.stream()
            .filter(table -> primaryTableId == null || !primaryTableId.equals(table.getId()))
            .map(table -> new LinkedTableResponse(table.getId(), table.getCode()))
            .toList();
        List<WaiterHistoryEntryResponse> history = waiterHistoryRepository
            .findByOrderIdOrderByAssignedAtAsc(order.getId())
            .stream()
            .map(this::toHistory)
            .toList();
        return new OrderResponse(
            order.getId(),
            order.getOrderNo(),
            channel,
            tableId,
            tableCode,
            order.getStoreId(),
            order.getStatus(),
            order.getDeliveryStatus(),
            order.getGuestCount(),
            order.getAdultCount(),
            order.getChildrenCount(),
            order.getClientName(),
            order.getClientPhone(),
            order.getDeliveryAddress(),
            order.getOpenedByUserId(),
            order.getWaiterUserId(),
            order.getCourierUserId(),
            order.getComment(),
            order.getOpenedAt(),
            order.getClosedAt(),
            orderTotals.billable(items),
            order.getCommissionPercent(),
            order.getCommissionBaseAmount(),
            order.getCommissionAmount(),
            order.getDiscountAmount() == null ? BigDecimal.ZERO : order.getDiscountAmount(),
            order.getServicePercent(),
            order.getServiceAmount(),
            itemResponses.size(),
            itemResponses,
            linked,
            history,
            order.getPickupNo()
        );
    }

    public OrderItemResponse toItem(FloorOrderItem item, List<FloorOrderItemModifier> modifiers) {
        return toItem(item, modifiers, Map.of(), Map.of());
    }

    public OrderItemResponse toItem(
        FloorOrderItem item,
        List<FloorOrderItemModifier> modifiers,
        Map<UUID, String> stationNames
    ) {
        return toItem(item, modifiers, stationNames, Map.of());
    }

    public OrderItemResponse toItem(
        FloorOrderItem item,
        List<FloorOrderItemModifier> modifiers,
        Map<UUID, String> stationNames,
        Map<UUID, MenuVariantFiscalLookup.FiscalFields> fiscalDonors
    ) {
        MenuItem menu = item.getMenuItem();
        UUID menuItemId = menu == null ? null : menu.getId();
        UUID stationId = item.getStationId();
        String stationName = stationId == null ? null : stationNames.get(stationId);
        MenuVariantFiscalLookup.FiscalFields fiscal = variantFiscalLookup.resolve(menu, fiscalDonors);
        return new OrderItemResponse(
            item.getId(),
            menuItemId,
            item.getName(),
            MenuPortionFormat.display(item.getMenuItem()),
            item.getQuantity(),
            item.getReturnedQuantity() == null ? BigDecimal.ZERO : item.getReturnedQuantity(),
            item.getSentQuantity() == null ? BigDecimal.ZERO : item.getSentQuantity(),
            item.getUnitPrice(),
            lineTotal(item.getQuantity(), item.getUnitPrice()),
            taxRateOf(item),
            item.getNote(),
            item.getItemStatus(),
            item.getSortOrder(),
            stationId,
            stationName,
            modifiers.stream()
                .map(mod -> new OrderItemModifierResponse(mod.getId(), mod.getName(), mod.getPriceDelta()))
                .toList(),
            fiscal.ikpu(),
            fiscal.packageCode(),
            fiscal.unitOfMeasure(),
            fiscal.unitMeasureCode(),
            fiscal.barcode(),
            fiscal.markedProduct()
        );
    }

    private Map<UUID, String> stationNamesFor(Integer companyId, List<FloorOrderItem> items) {
        List<UUID> ids = items.stream()
            .map(FloorOrderItem::getStationId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (ids.isEmpty() || companyId == null) {
            return Map.of();
        }
        return stationRepository.findByIdInAndCompanyId(ids, companyId).stream()
            .collect(Collectors.toMap(KitchenStation::getId, KitchenStation::getName, (a, b) -> a));
    }

    private static BigDecimal taxRateOf(FloorOrderItem item) {
        if (item.getMenuItem() != null && item.getMenuItem().getTaxRate() != null) {
            return item.getMenuItem().getTaxRate();
        }
        return item.getTaxRate() == null ? BigDecimal.ZERO : item.getTaxRate();
    }

    public BigDecimal lineTotal(BigDecimal quantity, BigDecimal unitPrice) {
        return quantity.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
    }

    public static String displayCode(OrderChannel channel, FloorOrder order) {
        if (channel == OrderChannel.DELIVERY) {
            return "DLV";
        }
        if (channel == OrderChannel.TAKEAWAY) {
            return "TW";
        }
        return "—";
    }

    private WaiterHistoryEntryResponse toHistory(FloorOrderWaiterHistory row) {
        return new WaiterHistoryEntryResponse(row.getWaiterUserId(), row.getAssignedAt());
    }
}
