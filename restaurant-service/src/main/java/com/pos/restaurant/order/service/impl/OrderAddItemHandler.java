package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.modifier.entity.MenuItemModifierLink;
import com.pos.restaurant.modifier.entity.ModifierGroup;
import com.pos.restaurant.modifier.entity.ModifierOption;
import com.pos.restaurant.modifier.repository.MenuItemModifierLinkRepository;
import com.pos.restaurant.modifier.repository.ModifierGroupRepository;
import com.pos.restaurant.modifier.repository.ModifierOptionRepository;
import com.pos.restaurant.modifier.support.ModifierSelectionPolicy;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.dto.AddOrderItemRequest;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.entity.FloorOrderItemModifier;
import com.pos.restaurant.order.repository.FloorOrderItemModifierRepository;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OrderAddItemHandler {

    private final FloorOrderItemRepository itemRepository;
    private final FloorOrderItemModifierRepository itemModifierRepository;
    private final MenuItemRepository menuItemRepository;
    private final MenuItemModifierLinkRepository linkRepository;
    private final ModifierGroupRepository groupRepository;
    private final ModifierOptionRepository optionRepository;
    private final ModifierSelectionPolicy selectionPolicy;
    private final OrderLookup orderLookup;
    private final FloorTenantSupport tenantSupport;
    private final OrderResponseAssembler assembler;

    @Transactional
    public OrderResponse handle(UUID orderId, AddOrderItemRequest request) {
        FloorOrder order = orderLookup.requireActive(orderId);
        Integer companyId = tenantSupport.requireCompanyId();
        MenuItem menuItem = menuItemRepository.findByIdAndCompanyId(request.menuItemId(), companyId)
            .orElseThrow(() -> new NotFoundException("Menu item not found: " + request.menuItemId()));
        if (!menuItem.isActive() || !menuItem.isAvailable()) {
            throw new BusinessException("Menu item is not available");
        }
        if (!menuItem.getStoreId().equals(order.getStoreId())) {
            throw new BusinessException("Menu item does not belong to this restaurant");
        }
        List<UUID> optionIds = request.modifierOptionIds() == null ? List.of() : request.modifierOptionIds();
        List<ModifierGroup> assignedGroups = assignedGroups(menuItem, companyId);
        List<ModifierOption> selected = optionIds.isEmpty()
            ? List.of()
            : optionRepository.findActiveByIdIn(optionIds);
        if (selected.size() != optionIds.stream().distinct().count()) {
            throw new BusinessException("One or more modifiers are not available");
        }
        selectionPolicy.assertValid(assignedGroups, selected);
        BigDecimal quantity = (request.quantity() == null ? BigDecimal.ONE : request.quantity())
            .setScale(3, RoundingMode.HALF_UP);
        String note = blankToNull(request.note());
        if (note == null && optionIds.isEmpty()) {
            var existing = itemRepository.findFirstByOrderIdAndMenuItemIdAndNoteIsNullAndItemStatus(
                orderId,
                menuItem.getId(),
                OrderItemStatus.NEW
            );
            if (existing.isPresent()
                && itemModifierRepository.findByOrderItemIdIn(List.of(existing.get().getId())).isEmpty()) {
                FloorOrderItem line = existing.get();
                line.setQuantity(line.getQuantity().add(quantity));
                LogUtil.info(OrderAddItemHandler.class, "Order item qty increased: id={}", line.getId());
                maybeCategorySlip(order, line, quantity, menuItem);
                return reload(order);
            }
        }
        BigDecimal extras = selected.stream()
            .map(ModifierOption::getPriceDelta)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        int nextSort = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId).size();
        FloorOrderItem saved = itemRepository.save(FloorOrderItem.builder()
            .order(order)
            .menuItem(menuItem)
            .name(menuItem.getName())
            .quantity(quantity)
            .unitPrice(menuItem.getPrice().add(extras).setScale(2, RoundingMode.HALF_UP))
            .taxRate(menuItem.getTaxRate() == null ? BigDecimal.ZERO : menuItem.getTaxRate())
            .stationId(menuItem.getStationId())
            .note(note)
            .sortOrder(nextSort)
            .build());
        itemModifierRepository.saveAll(selected.stream()
            .map(option -> FloorOrderItemModifier.builder()
                .orderItem(saved)
                .optionId(option.getId())
                .name(option.getName())
                .priceDelta(option.getPriceDelta())
                .build())
            .toList());
        LogUtil.info(OrderAddItemHandler.class, "Order item added: orderId={}", orderId);
        return reload(order);
    }

    private List<ModifierGroup> assignedGroups(MenuItem menuItem, Integer companyId) {
        List<UUID> groupIds = linkRepository.findByMenuItemId(menuItem.getId()).stream()
            .map(MenuItemModifierLink::getGroupId)
            .toList();
        if (groupIds.isEmpty()) {
            return List.of();
        }
        return groupRepository.findByIdInAndCompanyIdAndStoreIdAndActiveTrue(
            groupIds, companyId, menuItem.getStoreId()
        );
    }

    private OrderResponse reload(FloorOrder order) {
        return assembler.toResponse(order, itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(order.getId()));
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
