package com.pos.restaurant.report;

import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.payment.domain.PaymentCardType;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.report.domain.ReceiptStatus;
import com.pos.restaurant.report.dto.DishSalesReportResponse;
import com.pos.restaurant.report.dto.DishSalesReportRow;
import com.pos.restaurant.report.dto.ReceiptExportRequest;
import com.pos.restaurant.report.dto.SalesBreakdownRow;
import com.pos.restaurant.report.dto.SalesSummaryResponse;
import com.pos.restaurant.analytics.support.AnalyticsStaffNameResolver;
import com.pos.restaurant.report.support.DishSalesExcelWriter;
import com.pos.restaurant.report.support.DishSalesReportHandler;
import com.pos.restaurant.report.support.ReceiptJournalAssembler;
import com.pos.restaurant.report.support.ReceiptJournalReportHandler;
import com.pos.restaurant.report.support.SalesReportLoader;
import com.pos.restaurant.report.support.SalesSummaryReportHandler;
import com.pos.restaurant.report.support.SalesTimeBucketQuery;
import com.pos.restaurant.report.support.ShiftCashExcelWriter;
import com.pos.restaurant.report.support.ShiftCashReportHandler;
import com.pos.restaurant.report.support.ShiftCashReportLoader;
import com.pos.restaurant.shift.support.ShiftCashOpTotalsLoader;
import com.pos.restaurant.report.dto.ReceiptJournalFilter;
import com.pos.restaurant.report.dto.ReceiptJournalResponse;
import com.pos.restaurant.report.dto.ReceiptJournalRow;
import com.pos.restaurant.report.service.impl.RestaurantReportServiceImpl;
import com.pos.restaurant.report.support.ReceiptJournalExcelWriter;
import com.pos.restaurant.report.support.ReceiptJournalLoader;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Runs the receipt journal JPQL against real Postgres with the Liquibase schema,
 * so query syntax, joins and aggregates are checked end to end.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers(disabledWithoutDocker = true)
@Import({
    RestaurantReportServiceImpl.class,
    ReceiptJournalReportHandler.class,
    ReceiptJournalAssembler.class,
    ReceiptJournalLoader.class,
    ReceiptJournalExcelWriter.class,
    SalesSummaryReportHandler.class,
    SalesReportLoader.class,
    SalesTimeBucketQuery.class,
    DishSalesReportHandler.class,
    DishSalesExcelWriter.class,
    ShiftCashReportHandler.class,
    ShiftCashReportLoader.class,
    ShiftCashExcelWriter.class,
    ShiftCashOpTotalsLoader.class
})
class ReceiptJournalSqlTest {

    private static final int COMPANY = 1;
    private static final int STORE = 10;
    private static final UUID WAITER = UUID.randomUUID();
    private static final UUID OTHER_WAITER = UUID.randomUUID();
    private static final UUID CASHIER = UUID.randomUUID();

    @Container
    private static final PostgreSQLContainer<?> PG = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", PG::getJdbcUrl);
        registry.add("spring.datasource.username", PG::getUsername);
        registry.add("spring.datasource.password", PG::getPassword);
    }

    @Autowired
    private TestEntityManager em;

    @Autowired
    private RestaurantReportServiceImpl service;

    @MockBean
    private FloorTenantSupport tenantSupport;

    @MockBean
    private AnalyticsStaffNameResolver staffNameResolver;

    private final Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
    private FloorHall terrace;
    private FloorTable table;

    @BeforeEach
    void seed() {
        when(tenantSupport.requireCompanyId()).thenReturn(COMPANY);
        when(staffNameResolver.namesByIds(org.mockito.ArgumentMatchers.any())).thenReturn(Map.of());
        terrace = em.persist(FloorHall.builder().companyId(COMPANY).storeId(STORE).name("Терраса").build());
        table = em.persist(FloorTable.builder()
            .hall(terrace).companyId(COMPANY).storeId(STORE).code("T1").label("T1").build());

        FloorOrder a = order(101, OrderStatus.CLOSED, table, WAITER);
        a.setGuestCount(2);
        a.setDiscountAmount(new BigDecimal("5000"));
        a.setServiceAmount(new BigDecimal("10000"));
        item(a, "Плов", "2", "0", "45000");
        pay(a, PaymentMethod.CASH, "100000", now.minusSeconds(500));

        FloorOrder b = order(102, OrderStatus.CLOSED, null, OTHER_WAITER);
        b.setChannel(OrderChannel.TAKEAWAY);
        item(b, "Лагман", "2", "1", "30000");
        pay(b, PaymentMethod.CARD, "60000", now.minusSeconds(400)).setCardType(PaymentCardType.UZCARD);

        FloorOrder c = order(103, OrderStatus.REFUNDED, null, WAITER);
        item(c, "Чай", "1", "1", "40000");
        pay(c, PaymentMethod.CASH, "40000", now.minusSeconds(300));

        FloorOrder d = order(104, OrderStatus.CLOSED, null, WAITER);
        d.setClientName("Алишер");
        FloorOrderPayment credit = pay(d, PaymentMethod.CREDIT, "50000", now.minusSeconds(200));
        credit.setDebtPhone("+998901112233");
        credit.setDebtComment("до пятницы");
        credit.setDebtRemaining(new BigDecimal("50000"));

        FloorOrder e = order(105, OrderStatus.CLOSED, null, WAITER);
        FloorOrderPayment advance = pay(e, PaymentMethod.ADVANCE, "80000", now.minusSeconds(100));
        advance.setDebtPhone("+998907770000");
        advance.setAdvancePaid(new BigDecimal("30000"));
        advance.setDebtRemaining(new BigDecimal("50000"));

        FloorOrder yesterday = order(90, OrderStatus.CLOSED, null, WAITER);
        pay(yesterday, PaymentMethod.CASH, "999", now.minus(2, ChronoUnit.DAYS));

        FloorOrder otherStore = order(1, OrderStatus.CLOSED, null, WAITER);
        otherStore.setStoreId(STORE + 1);
        pay(otherStore, PaymentMethod.CASH, "777", now.minusSeconds(50));

        order(106, OrderStatus.OPEN, table, WAITER);
        em.flush();
        em.clear();
    }

    @Test
    void totalsCoverWholeFilterAndSubtractRefunds() {
        ReceiptJournalResponse page = service.receipts(STORE, filter(), 0, 2);

        assertThat(page.totalElements()).isEqualTo(5);
        assertThat(page.content()).hasSize(2);
        assertThat(page.content()).extracting(ReceiptJournalRow::orderNo).containsExactly(105, 104);

        var totals = page.totals();
        assertThat(totals.checkCount()).isEqualTo(5);
        assertThat(totals.totalAmount()).isEqualByComparingTo("330000");
        assertThat(totals.refundAmount()).isEqualByComparingTo("70000");
        assertThat(totals.netAmount()).isEqualByComparingTo("260000");
        assertThat(totals.averageCheck()).isEqualByComparingTo("52000");
        assertThat(totals.creditAmount()).isEqualByComparingTo("50000");
        assertThat(totals.advanceAmount()).isEqualByComparingTo("80000");
        assertThat(totals.debtRemaining()).isEqualByComparingTo("100000");
        assertThat(totals.discountAmount()).isEqualByComparingTo("5000");
        assertThat(totals.serviceAmount()).isEqualByComparingTo("10000");
        assertThat(totals.guestCount()).isEqualTo(6);
    }

    @Test
    void statusFilterSplitsPaidPartialAndRefunded() {
        assertThat(orderNos(statusFilter(ReceiptStatus.PAID))).containsExactlyInAnyOrder(101, 104, 105);

        ReceiptJournalResponse partial = service.receipts(STORE, statusFilter(ReceiptStatus.PARTIAL_REFUND), 0, 20);
        assertThat(partial.content()).singleElement().satisfies(row -> {
            assertThat(row.orderNo()).isEqualTo(102);
            assertThat(row.status()).isEqualTo(ReceiptStatus.PARTIAL_REFUND);
            assertThat(row.refundAmount()).isEqualByComparingTo("30000");
            assertThat(row.netAmount()).isEqualByComparingTo("30000");
        });
        assertThat(partial.totals().refundAmount()).isEqualByComparingTo("30000");

        ReceiptJournalResponse refunded = service.receipts(STORE, statusFilter(ReceiptStatus.REFUNDED), 0, 20);
        assertThat(refunded.content()).singleElement().satisfies(row -> {
            assertThat(row.status()).isEqualTo(ReceiptStatus.REFUNDED);
            assertThat(row.netAmount()).isEqualByComparingTo("0");
        });
    }

    @Test
    void filtersByMethodWaiterHallChannelAndCashier() {
        assertThat(orderNos(new ReceiptJournalFilter(from(), to(),
            List.of(PaymentMethod.CREDIT, PaymentMethod.ADVANCE), null, null, null, null, null, null)))
            .containsExactlyInAnyOrder(104, 105);
        assertThat(orderNos(new ReceiptJournalFilter(from(), to(), null, null, OTHER_WAITER, null, null, null, null)))
            .containsExactly(102);
        assertThat(orderNos(new ReceiptJournalFilter(from(), to(), null, null, null, null, terrace.getId(), null, null)))
            .containsExactly(101);
        assertThat(orderNos(new ReceiptJournalFilter(from(), to(), null, null, null, null, null, OrderChannel.TAKEAWAY, null)))
            .containsExactly(102);
        assertThat(orderNos(new ReceiptJournalFilter(from(), to(), null, null, null, CASHIER, null, null, null)))
            .hasSize(5);
    }

    @Test
    void searchMatchesTableOrderNoPhoneAndClient() {
        assertThat(orderNos(search("t1"))).containsExactly(101);
        assertThat(orderNos(search("№104"))).containsExactly(104);
        assertThat(orderNos(search("1112233"))).containsExactly(104);
        assertThat(orderNos(search("алишер"))).containsExactly(104);
        assertThat(orderNos(search("100%"))).isEmpty();
    }

    @Test
    void rowCarriesHallTableAndDebtDetails() {
        ReceiptJournalRow a = service.receipts(STORE, search("t1"), 0, 20).content().get(0);
        assertThat(a.hallName()).isEqualTo("Терраса");
        assertThat(a.tableCode()).isEqualTo("T1");
        assertThat(a.cashierUserId()).isEqualTo(CASHIER);
        assertThat(a.serviceAmount()).isEqualByComparingTo("10000");

        ReceiptJournalRow e = service.receipts(STORE, search("№105"), 0, 20).content().get(0);
        assertThat(e.advancePaid()).isEqualByComparingTo("30000");
        assertThat(e.debtRemaining()).isEqualByComparingTo("50000");
    }

    @Test
    void exportWritesEveryMatchingRowWithNamesAndTotals() throws Exception {
        byte[] xlsx = service.exportReceipts(STORE, new ReceiptExportRequest(
            filter(),
            Map.of(WAITER.toString(), "Азиз"),
            Map.of("method.CASH", "Наличные"),
            "Asia/Tashkent"
        ));

        try (XSSFWorkbook book = new XSSFWorkbook(new ByteArrayInputStream(xlsx))) {
            Sheet sheet = book.getSheetAt(0);
            assertThat(sheet.getRow(3).getCell(0).getStringCellValue()).isEqualTo("№ чека");
            assertThat(sheet.getRow(4).getCell(0).getNumericCellValue()).isEqualTo(105);
            assertThat(sheet.getRow(8).getCell(0).getNumericCellValue()).isEqualTo(101);
            assertThat(sheet.getRow(8).getCell(3).getStringCellValue()).isEqualTo("Терраса");
            assertThat(sheet.getRow(8).getCell(6).getStringCellValue()).isEqualTo("Азиз");
            assertThat(sheet.getRow(8).getCell(8).getStringCellValue()).isEqualTo("Наличные");
            assertThat(sheet.getRow(9)).isNull();
            assertThat(sheet.getRow(10).getCell(0).getStringCellValue()).isEqualTo("Итоги");
            assertThat(sheet.getRow(13).getCell(1).getNumericCellValue()).isEqualTo(330000d);
        }
    }

    @Test
    void salesSummaryBreaksDownByMethodCardChannelHallAndTime() {
        SalesSummaryResponse summary = service.salesSummary(STORE, filter(), "Asia/Tashkent");

        assertThat(summary.totals().totalAmount()).isEqualByComparingTo("330000");
        assertThat(summary.byMethod()).extracting(SalesBreakdownRow::key)
            .containsExactly("CASH", "ADVANCE", "CARD", "CREDIT");
        assertThat(summary.byMethod().get(0).count()).isEqualTo(2);
        assertThat(summary.byMethod().get(0).amount()).isEqualByComparingTo("140000");
        assertThat(summary.byCardType()).singleElement().satisfies(row -> {
            assertThat(row.key()).isEqualTo("UZCARD");
            assertThat(row.amount()).isEqualByComparingTo("60000");
        });
        assertThat(summary.byChannel()).extracting(SalesBreakdownRow::key).containsExactly("DINE_IN", "TAKEAWAY");
        assertThat(summary.byHall()).extracting(SalesBreakdownRow::key).containsExactly(null, "Терраса");
        assertThat(summary.byDay().stream().mapToLong(SalesBreakdownRow::count).sum()).isEqualTo(5);
        assertThat(summary.byHour().stream().map(SalesBreakdownRow::amount).reduce(BigDecimal.ZERO, BigDecimal::add))
            .isEqualByComparingTo("330000");
    }

    @Test
    void dishSalesNetOutReturnsAndShareOfRevenue() {
        DishSalesReportResponse dishes = service.dishSales(STORE, filter());

        assertThat(dishes.rows()).extracting(DishSalesReportRow::name).containsExactly("Плов", "Лагман", "Чай");
        DishSalesReportRow lagman = dishes.rows().get(1);
        assertThat(lagman.quantity()).isEqualByComparingTo("2");
        assertThat(lagman.returnedQuantity()).isEqualByComparingTo("1");
        assertThat(lagman.netQuantity()).isEqualByComparingTo("1");
        assertThat(lagman.refundAmount()).isEqualByComparingTo("30000");
        assertThat(lagman.netAmount()).isEqualByComparingTo("30000");
        assertThat(lagman.sharePercent()).isEqualByComparingTo("25.0");
        assertThat(dishes.rows().get(0).sharePercent()).isEqualByComparingTo("75.0");
        assertThat(dishes.netQuantity()).isEqualByComparingTo("3");
        assertThat(dishes.grossAmount()).isEqualByComparingTo("190000");
        assertThat(dishes.netAmount()).isEqualByComparingTo("120000");

        DishSalesReportResponse terraceOnly = service.dishSales(STORE,
            new ReceiptJournalFilter(from(), to(), null, null, null, null, terrace.getId(), null, null));
        assertThat(terraceOnly.rows()).extracting(DishSalesReportRow::name).containsExactly("Плов");
    }

    @Test
    void dishExportHasRowsAndTotalLine() throws Exception {
        byte[] xlsx = service.exportDishSales(STORE, new ReceiptExportRequest(filter(), Map.of(), Map.of(), "UTC"));
        try (XSSFWorkbook book = new XSSFWorkbook(new ByteArrayInputStream(xlsx))) {
            Sheet sheet = book.getSheetAt(0);
            assertThat(sheet.getRow(3).getCell(0).getStringCellValue()).isEqualTo("Блюдо");
            assertThat(sheet.getRow(4).getCell(0).getStringCellValue()).isEqualTo("Плов");
            assertThat(sheet.getRow(7).getCell(7).getNumericCellValue()).isEqualTo(120000d);
        }
    }

    private List<Integer> orderNos(ReceiptJournalFilter filter) {
        return service.receipts(STORE, filter, 0, 50).content().stream().map(ReceiptJournalRow::orderNo).toList();
    }

    private ReceiptJournalFilter filter() {
        return new ReceiptJournalFilter(from(), to(), null, null, null, null, null, null, null);
    }

    private ReceiptJournalFilter statusFilter(ReceiptStatus status) {
        return new ReceiptJournalFilter(from(), to(), null, status, null, null, null, null, null);
    }

    private ReceiptJournalFilter search(String term) {
        return new ReceiptJournalFilter(from(), to(), null, null, null, null, null, null, term);
    }

    private Instant from() {
        return now.minus(1, ChronoUnit.DAYS);
    }

    private Instant to() {
        return now.plusSeconds(60);
    }

    private FloorOrder order(int no, OrderStatus status, FloorTable onTable, UUID waiter) {
        return em.persist(FloorOrder.builder()
            .companyId(COMPANY)
            .storeId(STORE)
            .orderNo(no)
            .status(status)
            .table(onTable)
            .openedByUserId(waiter)
            .waiterUserId(waiter)
            .closedAt(status == OrderStatus.OPEN ? null : now)
            .build());
    }

    private void item(FloorOrder order, String name, String qty, String returned, String price) {
        em.persist(FloorOrderItem.builder()
            .order(order)
            .name(name)
            .quantity(new BigDecimal(qty))
            .returnedQuantity(new BigDecimal(returned))
            .unitPrice(new BigDecimal(price))
            .itemStatus(OrderItemStatus.SERVED)
            .build());
    }

    private FloorOrderPayment pay(FloorOrder order, PaymentMethod method, String amount, Instant paidAt) {
        BigDecimal value = new BigDecimal(amount);
        return em.persist(FloorOrderPayment.builder()
            .order(order)
            .method(method)
            .amount(value)
            .cashAmount(method == PaymentMethod.CASH ? value : BigDecimal.ZERO)
            .cardAmount(method == PaymentMethod.CARD ? value : BigDecimal.ZERO)
            .paidByUserId(CASHIER)
            .paidAt(paidAt)
            .build());
    }
}
