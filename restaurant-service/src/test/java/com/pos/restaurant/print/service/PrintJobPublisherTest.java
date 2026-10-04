package com.pos.restaurant.print.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.menu.entity.MenuCategory;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.repository.MenuCategoryRepository;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemModifierRepository;
import com.pos.restaurant.print.domain.PrintJobKind;
import com.pos.restaurant.print.entity.RestaurantPrintJob;
import com.pos.restaurant.print.repository.RestaurantPrintJobRepository;
import com.pos.restaurant.settings.service.KitchenBoardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrintJobPublisherTest {

    @Mock private RestaurantPrintJobRepository repository;
    @Mock private MenuCategoryRepository menuCategoryRepository;
    @Mock private FloorOrderItemModifierRepository itemModifierRepository;
    @Mock private KitchenBoardService kitchenBoardService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private PrintJobPublisher publisher;

    @BeforeEach
    void setUp() {
        publisher = new PrintJobPublisher(
            repository,
            menuCategoryRepository,
            itemModifierRepository,
            kitchenBoardService,
            objectMapper
        );
        lenient().when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(itemModifierRepository.findByOrderItemIdIn(any())).thenReturn(List.of());
    }

    @Test
    void voidSlips_boardOff_printsOnCategoryPrinter() throws Exception {
        when(kitchenBoardService.isEnabled(1, 2)).thenReturn(false);
        UUID categoryId = UUID.randomUUID();
        MenuCategory category = MenuCategory.builder()
            .id(categoryId)
            .companyId(1)
            .storeId(2)
            .name("Горячее")
            .autoPrint(true)
            .printPrinterName("Kitchen-Hot")
            .build();
        when(menuCategoryRepository.findByIdAndCompanyId(categoryId, 1)).thenReturn(Optional.of(category));

        FloorOrder order = order();
        FloorOrderItem item = kitchenItem(order, categoryId, "BEFSHTEKIS", "2");

        publisher.voidSlipsForItems(order, List.of(item));

        RestaurantPrintJob job = captureJob();
        assertThat(job.getKind()).isEqualTo(PrintJobKind.CATEGORY_BATCH);
        JsonNode payload = objectMapper.readTree(job.getPayload());
        assertThat(payload.get("printerName").asText()).isEqualTo("Kitchen-Hot");
        assertThat(payload.get("title").asText()).contains("ОТКАЗ");
        assertThat(payload.get("lines")).hasSize(1);
        assertThat(payload.get("lines").get(0).get("name").asText()).isEqualTo("BEFSHTEKIS");
        assertThat(payload.get("lines").get(0).get("quantity").asDouble()).isEqualTo(2.0);
    }

    @Test
    void voidSlips_boardOff_qtyCut_usesRefusedDelta() throws Exception {
        when(kitchenBoardService.isEnabled(1, 2)).thenReturn(false);
        UUID categoryId = UUID.randomUUID();
        MenuCategory category = MenuCategory.builder()
            .id(categoryId)
            .companyId(1)
            .storeId(2)
            .name("Салаты")
            .autoPrint(true)
            .printPrinterName("Salad-Printer")
            .build();
        when(menuCategoryRepository.findByIdAndCompanyId(categoryId, 1)).thenReturn(Optional.of(category));

        FloorOrder order = order();
        FloorOrderItem item = kitchenItem(order, categoryId, "Salat", "5");

        publisher.voidSlipsForItems(order, List.of(item), Map.of(item.getId(), new BigDecimal("2")));

        JsonNode payload = objectMapper.readTree(captureJob().getPayload());
        assertThat(payload.get("lines").get(0).get("quantity").asDouble()).isEqualTo(2.0);
    }

    @Test
    void voidSlips_boardOn_routesToKitchenSendVoid() throws Exception {
        when(kitchenBoardService.isEnabled(1, 2)).thenReturn(true);
        FloorOrder order = order();
        FloorOrderItem item = kitchenItem(order, UUID.randomUUID(), "Lagman", "1");

        publisher.voidSlipsForItems(order, List.of(item));

        RestaurantPrintJob job = captureJob();
        assertThat(job.getKind()).isEqualTo(PrintJobKind.KITCHEN_SEND);
        JsonNode payload = objectMapper.readTree(job.getPayload());
        assertThat(payload.get("voidSlip").asBoolean()).isTrue();
        assertThat(payload.get("lines")).hasSize(1);
        assertThat(payload.get("lines").get(0).get("itemId").asText()).isEqualTo(item.getId().toString());
        verify(menuCategoryRepository, never()).findByIdAndCompanyId(any(), any());
    }

    @Test
    void voidSlips_skipsNewItems() {
        when(kitchenBoardService.isEnabled(1, 2)).thenReturn(false);
        FloorOrder order = order();
        FloorOrderItem item = kitchenItem(order, UUID.randomUUID(), "Tea", "1");
        item.setItemStatus(OrderItemStatus.NEW);

        publisher.voidSlipsForItems(order, List.of(item));

        verify(repository, never()).save(any());
    }

    @Test
    void guestBill_includesHallTableHeader() throws Exception {
        FloorHall hall = FloorHall.builder().id(1).companyId(1).storeId(2).name("Asosiy zal").build();
        FloorTable table = FloorTable.builder().id(10).companyId(1).storeId(2).code("2").hall(hall).build();
        FloorOrder order = FloorOrder.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .storeId(2)
            .orderNo(729)
            .channel(OrderChannel.DINE_IN)
            .status(OrderStatus.OPEN)
            .table(table)
            .build();

        publisher.guestBill(order);

        RestaurantPrintJob job = captureJob();
        assertThat(job.getKind()).isEqualTo(PrintJobKind.GUEST_BILL);
        JsonNode payload = objectMapper.readTree(job.getPayload());
        assertThat(payload.get("orderId").asText()).isEqualTo(order.getId().toString());
        assertThat(payload.get("header").asText()).isEqualTo("Asosiy zal · Стол 2");
    }

    @Test
    void orderCancelSlip_enqueuesCashierOnlyJob() throws Exception {
        FloorOrder order = order();
        FloorOrderItem hot = kitchenItem(order, UUID.randomUUID(), "Steak", "1");
        FloorOrderItem drink = kitchenItem(order, UUID.randomUUID(), "Cola", "2");
        drink.setItemStatus(OrderItemStatus.NEW);

        publisher.orderCancelSlip(order, List.of(hot, drink));

        RestaurantPrintJob job = captureJob();
        assertThat(job.getKind()).isEqualTo(PrintJobKind.ORDER_CANCEL);
        JsonNode payload = objectMapper.readTree(job.getPayload());
        assertThat(payload.get("lines")).hasSize(2);
        verify(kitchenBoardService, never()).isEnabled(any(), any());
    }

    @Test
    void voidSlips_boardOff_skipsWhenCategoryHasNoPrinter() {
        when(kitchenBoardService.isEnabled(1, 2)).thenReturn(false);
        UUID categoryId = UUID.randomUUID();
        MenuCategory category = MenuCategory.builder()
            .id(categoryId)
            .companyId(1)
            .storeId(2)
            .name("Без принтера")
            .autoPrint(false)
            .printPrinterName(null)
            .build();
        when(menuCategoryRepository.findByIdAndCompanyId(categoryId, 1)).thenReturn(Optional.of(category));

        FloorOrder order = order();
        publisher.voidSlipsForItems(order, List.of(kitchenItem(order, categoryId, "X", "1")));

        verify(repository, never()).save(any());
    }

    private RestaurantPrintJob captureJob() {
        ArgumentCaptor<RestaurantPrintJob> cap = ArgumentCaptor.forClass(RestaurantPrintJob.class);
        verify(repository).save(cap.capture());
        return cap.getValue();
    }

    private static FloorOrder order() {
        return FloorOrder.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .storeId(2)
            .orderNo(42)
            .status(OrderStatus.OPEN)
            .build();
    }

    private static FloorOrderItem kitchenItem(FloorOrder order, UUID categoryId, String name, String qty) {
        MenuItem menuItem = MenuItem.builder()
            .id(UUID.randomUUID())
            .menuCategoryId(categoryId)
            .name(name)
            .build();
        return FloorOrderItem.builder()
            .id(UUID.randomUUID())
            .order(order)
            .menuItem(menuItem)
            .name(name)
            .quantity(new BigDecimal(qty))
            .sentQuantity(new BigDecimal(qty))
            .unitPrice(BigDecimal.TEN)
            .taxRate(BigDecimal.ZERO)
            .itemStatus(OrderItemStatus.SENT_TO_KITCHEN)
            .build();
    }
}
