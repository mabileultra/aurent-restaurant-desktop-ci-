package com.pos.restaurant.edge.live;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OrderPaymentRow;
import com.pos.restaurant.edge.support.EdgeCatalogKitchenBootstrapWriter;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * AUR-17: синхронизация оплат edge ↔ cloud (live floor и bootstrap) переносит реквизиты карты
 * и не стирает их, если узел старой версии прислал строку без этих полей.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers(disabledWithoutDocker = true)
class EdgePaymentCardDetailsSyncTest {

    private static final UUID CASHIER = UUID.randomUUID();

    @Container
    private static final PostgreSQLContainer<?> PG = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", PG::getJdbcUrl);
        registry.add("spring.datasource.username", PG::getUsername);
        registry.add("spring.datasource.password", PG::getPassword);
    }

    @Autowired private TestEntityManager em;
    @Autowired private JdbcTemplate jdbc;

    /** Writers created directly: the bootstrap writer exists only when app.restaurant.edge.enabled=true. */
    private LiveFloorUpsertWriter liveFloorWriter;
    private EdgeCatalogKitchenBootstrapWriter bootstrapWriter;

    @BeforeEach
    void writers() {
        liveFloorWriter = new LiveFloorUpsertWriter(jdbc);
        bootstrapWriter = new EdgeCatalogKitchenBootstrapWriter(jdbc);
    }

    @Test
    void liveFloorSyncCarriesCardDetailsAndOlderPeerDoesNotWipeThem() {
        UUID orderId = order(301);
        UUID paymentId = UUID.randomUUID();

        liveFloorWriter.upsertPayments(snapshot(row(paymentId, orderId, "SOCIAL", "123456789012", "8600********1234")));
        liveFloorWriter.upsertPayments(snapshot(row(paymentId, orderId, null, null, null)));

        assertThat(cardColumns(paymentId))
            .containsEntry("card_category", "SOCIAL")
            .containsEntry("rrn", "123456789012")
            .containsEntry("social_card_number", "8600********1234");
    }

    @Test
    void bootstrapSyncCarriesCardDetailsAndOlderPeerDoesNotWipeThem() {
        UUID orderId = order(302);
        UUID paymentId = UUID.randomUUID();

        bootstrapWriter.upsertOrderPayments(snapshot(row(paymentId, orderId, "PERSONAL", "123456789012", null)));
        bootstrapWriter.upsertOrderPayments(snapshot(row(paymentId, orderId, null, null, null)));

        assertThat(cardColumns(paymentId))
            .containsEntry("card_category", "PERSONAL")
            .containsEntry("rrn", "123456789012")
            .containsEntry("social_card_number", null);
    }

    private Map<String, Object> cardColumns(UUID paymentId) {
        return jdbc.queryForMap(
            "SELECT card_category, rrn, social_card_number FROM floor_order_payments WHERE id = ?", paymentId);
    }

    private UUID order(int no) {
        FloorOrder order = em.persistAndFlush(FloorOrder.builder()
            .companyId(1)
            .storeId(10)
            .orderNo(no)
            .status(OrderStatus.CLOSED)
            .openedByUserId(CASHIER)
            .waiterUserId(CASHIER)
            .closedAt(Instant.now())
            .build());
        return order.getId();
    }

    private static OrderPaymentRow row(UUID id, UUID orderId, String category, String rrn, String socialNumber) {
        BigDecimal amount = new BigDecimal("50000.00");
        return new OrderPaymentRow(
            id, orderId, "CARD", amount, BigDecimal.ZERO, amount, amount, BigDecimal.ZERO, "UZCARD",
            null, null, null, null, CASHIER, Instant.now(), category, rrn, socialNumber
        );
    }

    private static EdgeCatalogSnapshot snapshot(OrderPaymentRow row) {
        return new EdgeCatalogSnapshot(
            1, 10, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, List.of(row), null
        );
    }
}
