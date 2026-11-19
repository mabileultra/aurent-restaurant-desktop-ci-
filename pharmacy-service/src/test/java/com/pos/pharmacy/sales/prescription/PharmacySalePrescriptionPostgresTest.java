package com.pos.pharmacy.sales.prescription;

import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.SaleResponse;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.sales.support.SaleMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * AUR-18 на настоящем PostgreSQL: номер электронного рецепта хранится в sales (реальный Liquibase,
 * {@code ddl-auto: validate}) и возвращается {@link SaleMapper}: детали, история, повторная печать.
 */
@Testcontainers(disabledWithoutDocker = true)
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PharmacySalePrescriptionPostgresTest {

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
    void prescriptionNumberIsStoredAndReturned() {
        Sale sale = baseSale("PH-AUR18-1", SaleEnums.PaymentMethod.CASH);
        sale.setPrescriptionNumber("RX-2026/001");
        UUID id = saleRepository.saveAndFlush(sale).getId();
        entityManager.clear();

        SaleResponse response = saleMapper.toResponse(saleRepository.findById(id).orElseThrow());

        assertThat(response.prescriptionNumber()).isEqualTo("RX-2026/001");
        assertThat(jdbc.queryForObject("SELECT prescription_number FROM sales WHERE id = ?", String.class, id))
            .isEqualTo("RX-2026/001");
    }

    @Test
    void saleWithoutPrescriptionReturnsNull() {
        UUID id = saleRepository.saveAndFlush(baseSale("PH-AUR18-2", SaleEnums.PaymentMethod.CASH)).getId();
        entityManager.clear();

        assertThat(saleMapper.toResponse(saleRepository.findById(id).orElseThrow()).prescriptionNumber()).isNull();
    }

    @Test
    void columnHoldsSixtyFourCharacters() {
        Sale sale = baseSale("PH-AUR18-3", SaleEnums.PaymentMethod.CASH);
        sale.setPrescriptionNumber("A".repeat(64));

        UUID id = saleRepository.saveAndFlush(sale).getId();

        assertThat(jdbc.queryForObject("SELECT LENGTH(prescription_number) FROM sales WHERE id = ?", Integer.class, id))
            .isEqualTo(64);
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
