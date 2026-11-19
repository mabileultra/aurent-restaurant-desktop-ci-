package com.pos.sales.carddetails;

import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.sales.dto.sale.SaleResponse;
import com.pos.sales.entity.Sale;
import com.pos.sales.mapper.SaleLineMapperImpl;
import com.pos.sales.mapper.SaleMapper;
import com.pos.sales.mapper.SaleMapperImpl;
import com.pos.sales.repository.SaleRepository;
import com.pos.shared.payment.CardCategory;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * AUR-17 на настоящем PostgreSQL: схема поднимается реальным Liquibase (весь master),
 * Hibernate проверяет сущность ({@code ddl-auto: validate}), ответ собирает настоящий {@link SaleMapper}.
 * Его используют детали продажи, список, my-sales, чек по номеру и чек возврата.
 */
@Testcontainers(disabledWithoutDocker = true)
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({SaleMapperImpl.class, SaleLineMapperImpl.class})
class SaleCardDetailsPostgresTest {

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
    @Autowired private SaleMapper saleMapper;
    @Autowired private EntityManager entityManager;
    @Autowired private JdbcTemplate jdbc;

    private int storeId;
    private UUID cashierId;

    @BeforeEach
    void setUp() {
        int companyId = insertWithRequiredColumns("companies", Map.of(
            "name", "AUR-17 company", "login_code", "aur2-" + System.nanoTime(), "business_type", "GROCERY"));
        storeId = insertWithRequiredColumns("stores", Map.of(
            "name", "AUR-17 shop", "company_id", companyId, "is_active", true, "business_type", "GROCERY"));
        cashierId = UUID.randomUUID();
        Integer roleId = jdbc.queryForObject("SELECT MIN(id) FROM roles", Integer.class);
        insertWithRequiredColumns("users", Map.of(
            "id", cashierId, "username", "aur2-" + cashierId, "email", cashierId + "@aur2.test",
            "full_name", "AUR-17 cashier", "company_id", companyId, "role_id", roleId));
    }

    @Test
    void cardDetailsAreStoredAndReturnedInDetailsAndSummary() {
        Sale sale = baseSale("AUR2-1", Sale.PaymentMethod.CARD);
        sale.setCardType(Sale.CardType.UZCARD);
        sale.setCardCategory(CardCategory.SOCIAL);
        sale.setRrn("123456789012");
        sale.setSocialCardNumber("8600********1234");
        UUID id = saleRepository.saveAndFlush(sale).getId();
        entityManager.clear();

        Sale reloaded = saleRepository.findById(id).orElseThrow();
        SaleResponse details = saleMapper.toResponse(reloaded);
        SaleResponse summary = saleMapper.toSummaryResponse(reloaded);

        for (SaleResponse response : new SaleResponse[] {details, summary}) {
            assertThat(response.cardCategory()).isEqualTo("SOCIAL");
            assertThat(response.rrn()).isEqualTo("123456789012");
            assertThat(response.socialCardNumber()).isEqualTo("8600********1234");
            assertThat(response.cardType()).isEqualTo("UZCARD");
        }
        assertThat(jdbc.queryForMap("SELECT card_category, rrn, social_card_number FROM sales WHERE id = ?", id))
            .containsEntry("card_category", "SOCIAL")
            .containsEntry("rrn", "123456789012")
            .containsEntry("social_card_number", "8600********1234");
    }

    @Test
    void saleWithoutCardDetailsReturnsNulls() {
        UUID id = saleRepository.saveAndFlush(baseSale("AUR2-2", Sale.PaymentMethod.CASH)).getId();
        entityManager.clear();

        SaleResponse response = saleMapper.toResponse(saleRepository.findById(id).orElseThrow());

        assertThat(response.cardCategory()).isNull();
        assertThat(response.rrn()).isNull();
        assertThat(response.socialCardNumber()).isNull();
    }

    @Test
    void databaseRejectsFullSocialCardNumber() {
        UUID id = saleRepository.saveAndFlush(baseSale("AUR2-3", Sale.PaymentMethod.CARD)).getId();

        assertThatThrownBy(() -> jdbc.update(
            "UPDATE sales SET card_category = 'SOCIAL', social_card_number = ? WHERE id = ?", "8600123456781234", id))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    private Sale baseSale(String receipt, Sale.PaymentMethod method) {
        BigDecimal total = new BigDecimal("1000.00");
        return Sale.builder()
            .receiptNumber(receipt)
            .cashier(entityManager.getReference(User.class, cashierId))
            .store(entityManager.getReference(Store.class, storeId))
            .subtotal(total)
            .taxTotal(BigDecimal.ZERO)
            .discountTotal(BigDecimal.ZERO)
            .changeGiven(BigDecimal.ZERO)
            .status(Sale.SaleStatus.COMPLETED)
            .totalAmount(total)
            .paymentMethod(method)
            .cashAmount(method == Sale.PaymentMethod.CASH ? total : BigDecimal.ZERO)
            .cardAmount(method == Sale.PaymentMethod.CARD ? total : BigDecimal.ZERO)
            .receiptType(Sale.ReceiptType.SALE)
            .build();
    }

    private int insertWithRequiredColumns(String table, Map<String, Object> values) {
        Map<String, Object> row = new java.util.LinkedHashMap<>(values);
        jdbc.queryForList(
            "SELECT column_name, data_type FROM information_schema.columns "
                + "WHERE table_schema = current_schema() AND table_name = ? "
                + "AND is_nullable = 'NO' AND column_default IS NULL AND column_name <> 'id'",
            table
        ).forEach(col -> row.putIfAbsent((String) col.get("column_name"), neutralValue((String) col.get("data_type"))));
        String columns = String.join(", ", row.keySet());
        String marks = String.join(", ", java.util.Collections.nCopies(row.size(), "?"));
        jdbc.update("INSERT INTO " + table + " (" + columns + ") VALUES (" + marks + ")", row.values().toArray());
        return values.containsKey("id") ? 0 : jdbc.queryForObject("SELECT MAX(id) FROM " + table, Integer.class);
    }

    private static Object neutralValue(String dataType) {
        return switch (dataType) {
            case "boolean" -> false;
            case "integer", "bigint", "smallint", "numeric" -> 0;
            case "timestamp with time zone", "timestamp without time zone" -> java.sql.Timestamp.from(java.time.Instant.now());
            case "date" -> java.sql.Date.valueOf(java.time.LocalDate.now());
            case "uuid" -> UUID.randomUUID();
            default -> "aur2";
        };
    }
}
