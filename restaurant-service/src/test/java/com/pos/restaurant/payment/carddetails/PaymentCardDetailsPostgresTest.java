package com.pos.restaurant.payment.carddetails;

import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.dto.OrderPaymentResponse;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.payment.support.OrderPaymentResponseMapper;
import com.pos.shared.payment.CardCategory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * AUR-17 на настоящем PostgreSQL (схема — Liquibase ресторана, тот же changelog на edge):
 * оплата хранит реквизиты карты, ответ ({@link OrderPaymentResponseMapper}: GET оплаты, фискализация) их отдаёт.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers(disabledWithoutDocker = true)
@Import(OrderPaymentResponseMapper.class)
class PaymentCardDetailsPostgresTest {

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
    @Autowired private OrderPaymentResponseMapper mapper;

    @Test
    void cardDetailsAreStoredAndReturned() {
        FloorOrder order = order(201);
        FloorOrderPayment payment = pay(order, PaymentMethod.CARD);
        payment.setCardCategory(CardCategory.SOCIAL);
        payment.setRrn("123456789012");
        payment.setSocialCardNumber("8600********1234");
        em.flush();
        em.clear();

        OrderPaymentResponse response = mapper.toResponse(order.getId(), em.find(FloorOrderPayment.class, payment.getId()));

        assertThat(response.cardCategory()).isEqualTo(CardCategory.SOCIAL);
        assertThat(response.rrn()).isEqualTo("123456789012");
        assertThat(response.socialCardNumber()).isEqualTo("8600********1234");
    }

    @Test
    void paymentWithoutCardDetailsReturnsNulls() {
        FloorOrder order = order(202);
        FloorOrderPayment payment = pay(order, PaymentMethod.CASH);
        em.flush();
        em.clear();

        OrderPaymentResponse response = mapper.toResponse(order.getId(), em.find(FloorOrderPayment.class, payment.getId()));

        assertThat(response.cardCategory()).isNull();
        assertThat(response.rrn()).isNull();
        assertThat(response.socialCardNumber()).isNull();
    }

    @Test
    void databaseRejectsFullSocialCardNumber() {
        FloorOrderPayment payment = pay(order(203), PaymentMethod.CARD);
        em.flush();

        assertThatThrownBy(() -> jdbc.update(
            "UPDATE floor_order_payments SET card_category = 'SOCIAL', social_card_number = ? WHERE id = ?",
            "8600123456781234", payment.getId()))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    private FloorOrder order(int no) {
        return em.persist(FloorOrder.builder()
            .companyId(1)
            .storeId(10)
            .orderNo(no)
            .status(OrderStatus.CLOSED)
            .openedByUserId(CASHIER)
            .waiterUserId(CASHIER)
            .closedAt(Instant.now())
            .build());
    }

    private FloorOrderPayment pay(FloorOrder order, PaymentMethod method) {
        BigDecimal value = new BigDecimal("50000.00");
        return em.persist(FloorOrderPayment.builder()
            .order(order)
            .method(method)
            .amount(value)
            .cashAmount(method == PaymentMethod.CASH ? value : BigDecimal.ZERO)
            .cardAmount(method == PaymentMethod.CARD ? value : BigDecimal.ZERO)
            .paidByUserId(CASHIER)
            .paidAt(Instant.now())
            .build());
    }
}
