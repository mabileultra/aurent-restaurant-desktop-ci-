package com.pos.pharmacy.sales.carddetails;

import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.SaleResponse;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.sales.support.SaleMapper;
import com.pos.shared.payment.CardCategory;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * AUR-17 на настоящем PostgreSQL: схема — реальный Liquibase аптеки, сущность проверяет
 * Hibernate ({@code ddl-auto: validate}), ответ собирает {@link SaleMapper} (детали, список, чек, возврат).
 */
@Testcontainers(disabledWithoutDocker = true)
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PharmacySaleCardDetailsPostgresTest {

    @Container
    static final PostgreSQLContainer<?> PG = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", PG::getJdbcUrl);
        registry.add("spring.datasource.username", PG::getUsername);
        registry.add("spring.datasource.password", PG::getPassword);
        registry.add("spring.liquibase.enabled", () -> "true");
    }

    @Autowired private SaleRepository saleRepository;
    @Autowired private EntityManager entityManager;
    @Autowired private JdbcTemplate jdbc;

    private final SaleMapper saleMapper = new SaleMapper();

    @Test
    void cardDetailsAreStoredAndReturned() {
        Sale sale = baseSale("PH-AUR2-1", SaleEnums.PaymentMethod.CARD);
        sale.setCardCategory(CardCategory.SOCIAL);
        sale.setRrn("123456789012");
        sale.setSocialCardNumber("8600********1234");
        UUID id = saleRepository.saveAndFlush(sale).getId();
        entityManager.clear();

        SaleResponse response = saleMapper.toResponse(saleRepository.findById(id).orElseThrow());

        assertThat(response.cardCategory()).isEqualTo("SOCIAL");
        assertThat(response.rrn()).isEqualTo("123456789012");
        assertThat(response.socialCardNumber()).isEqualTo("8600********1234");
        assertThat(jdbc.queryForMap("SELECT card_category, rrn, social_card_number FROM sales WHERE id = ?", id))
            .containsEntry("card_category", "SOCIAL")
            .containsEntry("rrn", "123456789012")
            .containsEntry("social_card_number", "8600********1234");
    }

    @Test
    void saleWithoutCardDetailsReturnsNulls() {
        UUID id = saleRepository.saveAndFlush(baseSale("PH-AUR2-2", SaleEnums.PaymentMethod.CASH)).getId();
        entityManager.clear();

        SaleResponse response = saleMapper.toResponse(saleRepository.findById(id).orElseThrow());

        assertThat(response.cardCategory()).isNull();
        assertThat(response.rrn()).isNull();
        assertThat(response.socialCardNumber()).isNull();
    }

    @Test
    void databaseRejectsFullSocialCardNumber() {
        UUID id = saleRepository.saveAndFlush(baseSale("PH-AUR2-3", SaleEnums.PaymentMethod.CARD)).getId();

        assertThatThrownBy(() -> jdbc.update(
            "UPDATE sales SET card_category = 'SOCIAL', social_card_number = ? WHERE id = ?", "8600123456781234", id))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    private static Sale baseSale(String receipt, SaleEnums.PaymentMethod method) {
        BigDecimal total = new BigDecimal("1000.00");
        return Sale.builder()
            .companyId(1)
            .storeId(1)
            .cashierId(UUID.randomUUID())
            .cashierName("AUR-17 cashier")
            .receiptNumber(receipt)
            .subtotal(total)
            .totalAmount(total)
            .paymentMethod(method)
            .cashAmount(method == SaleEnums.PaymentMethod.CASH ? total : BigDecimal.ZERO)
            .cardAmount(method == SaleEnums.PaymentMethod.CARD ? total : BigDecimal.ZERO)
            .status(SaleEnums.SaleStatus.COMPLETED)
            .build();
    }
}
