package com.pos.integrations.fiscal;

import com.pos.exception.ConflictException;
import com.pos.exception.GlobalExceptionHandler;
import com.pos.integrations.fiscal.support.FiscalModuleBindingGuard;
import com.pos.integrations.fiscal.support.FiscalModuleLock;
import com.pos.integrations.multikassa.controller.AdminMultikassaSettingsController;
import com.pos.integrations.multikassa.service.MultikassaSettingsService;
import com.pos.integrations.multikassa.service.impl.MultikassaSettingsServiceImpl;
import com.pos.integrations.multikassa.support.MultikassaCashierRegisterGuard;
import com.pos.sales.dto.cashregister.UpsertCashRegisterRequest;
import com.pos.sales.mapper.CashRegisterMapper;
import com.pos.sales.service.CashRegisterService;
import com.pos.sales.service.impl.CashRegisterServiceImpl;
import com.pos.sales.support.CashRegisterStatusToggle;
import com.pos.service.support.CashierSaleSupport;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.DbExceptionTranslator;
import liquibase.Contexts;
import liquibase.LabelExpression;
import liquibase.Liquibase;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.resource.ClassLoaderResourceAccessor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

/**
 * AUR-19 на настоящем PostgreSQL: схема поднимается реальным Liquibase (весь master, включая v60).
 * Проверяет JPQL guard ({@code excludeId = null}), гонку через HTTP, HALT-precondition, отчёт о дублях
 * и unique-индексы как последний рубеж.
 */
@Testcontainers(disabledWithoutDocker = true)
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({
    FiscalModuleBindingGuard.class,
    FiscalModuleLock.class,
    MultikassaSettingsServiceImpl.class,
    CashRegisterServiceImpl.class
})
class FiscalModulePostgresTest {

    private static final String MASTER_CHANGELOG = "db/changelog/db.changelog-master.xml";
    private static final String V60_CHANGELOG = "db/changelog/v60-fiscal-module-unique.xml";
    private static final String V60_CHANGESET_ID = "v60-fiscal-module-unique-indexes";
    private static final int LOCK_NAMESPACE = 1919;
    private static final List<String> FM_INDEXES = List.of(
        "uq_cash_registers_fm_fiscal_card_id",
        "uq_cr_fiscal_drive_fm_factory_id",
        "uq_cr_fiscal_drive_fm_terminal_id",
        "uq_cr_multikassa_fm_module_number",
        "uq_cr_multikassa_fm_selected_drive_id",
        "uq_cr_multikassa_fm_terminal_id"
    );

    @Container
    static final PostgreSQLContainer<?> PG = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", PG::getJdbcUrl);
        registry.add("spring.datasource.username", PG::getUsername);
        registry.add("spring.datasource.password", PG::getPassword);
        registry.add("spring.liquibase.enabled", () -> "true");
    }

    @MockBean private TenantAccessSupport tenantAccess;
    @MockBean private CashierSaleSupport cashierSaleSupport;
    @MockBean private MultikassaCashierRegisterGuard cashierRegisterGuard;
    @MockBean private CashRegisterMapper cashRegisterMapper;
    @MockBean private CashRegisterStatusToggle cashRegisterStatusToggle;
    @SpyBean private FiscalModuleLock fiscalModuleLock;

    @Autowired private MultikassaSettingsService multikassaSettingsService;
    @Autowired private CashRegisterService cashRegisterService;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DataSource dataSource;

    private MockMvc mvc;
    private int storeId;

    @BeforeEach
    void setUp() {
        jdbc.update("DELETE FROM cash_register_multikassa_settings");
        jdbc.update("DELETE FROM cash_register_fiscal_drive_settings");
        jdbc.update("DELETE FROM cash_registers");
        storeId = ensureStore();
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        ReflectionTestUtils.setField(handler, "includeContextInResponse", false);
        mvc = MockMvcBuilders
            .standaloneSetup(new AdminMultikassaSettingsController(multikassaSettingsService))
            .setControllerAdvice(handler)
            .build();
    }

    // ---- B1: create с занятым ФМ — excludeId = null не должен «съесть» конфликт -------------------

    @Test
    void createWithOccupiedModuleIsConflictOnRealPostgres() {
        cashRegisterService.create(new UpsertCashRegisterRequest(storeId, 1, null, null, "YZ1", null, null));

        ConflictException ex = catchThrowableOfType(
            () -> cashRegisterService.create(new UpsertCashRegisterRequest(storeId, 2, null, null, " yz1 ", null, null)),
            ConflictException.class
        );

        assertThat(ex.getMessage()).isEqualTo("Фискальный модуль «yz1» уже привязан к кассе №1 (Магазин: «AUR-19 shop»)");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM cash_registers", Integer.class)).isEqualTo(1);
    }

    @Test
    void updateSameRegisterKeepsItsModuleOnRealPostgres() {
        cashRegisterService.create(new UpsertCashRegisterRequest(storeId, 1, null, null, "YZ1", null, null));
        long id = registerId(1);

        cashRegisterService.update(id, new UpsertCashRegisterRequest(storeId, 1, "m", null, " yz1 ", null, null));

        assertThat(jdbc.queryForObject("SELECT fiscal_card_id FROM cash_registers WHERE id = ?", String.class, id))
            .isEqualTo("yz1");
    }

    // ---- B2: гонка через HTTP: terminal_id кассы 1 ↔ module_number кассы 2 --------------------------

    @Test
    void parallelTerminalIdAndModuleNumberGiveOneSuccessAndOne409() throws Exception {
        long first = insertRegister(1);
        long second = insertRegister(2);
        CountDownLatch firstHoldsLock = new CountDownLatch(1);
        CountDownLatch releaseFirst = new CountDownLatch(1);
        AtomicBoolean pauseNext = new AtomicBoolean(true);
        doAnswer(inv -> {
            inv.callRealMethod();
            if (pauseNext.compareAndSet(true, false)) {
                firstHoldsLock.countDown();
                assertThat(releaseFirst.await(30, TimeUnit.SECONDS)).isTrue();
            }
            return null;
        }).when(fiscalModuleLock).lockAll(anyCollection());

        CompletableFuture<MvcResult> terminal = CompletableFuture.supplyAsync(
            () -> putMultikassa(first, "{\"enabled\":true,\"baseUrl\":\"http://127.0.0.1:8080\",\"terminalId\":\"YZ777\"}")
        );
        assertThat(firstHoldsLock.await(30, TimeUnit.SECONDS)).isTrue();
        CompletableFuture<MvcResult> module = CompletableFuture.supplyAsync(
            () -> putMultikassa(second, "{\"enabled\":true,\"baseUrl\":\"http://127.0.0.1:8080\",\"moduleNumber\":\" yz777 \"}")
        );

        assertThat(waitForBlockedAdvisoryLock()).as("второй запрос ждёт тот же advisory-lock").isTrue();
        assertThat(module).isNotDone();
        releaseFirst.countDown();

        MvcResult terminalResult = terminal.get(30, TimeUnit.SECONDS);
        MvcResult moduleResult = module.get(30, TimeUnit.SECONDS);
        assertThat(terminalResult.getResponse().getStatus()).isEqualTo(200);
        assertThat(moduleResult.getResponse().getStatus()).isEqualTo(409);
        assertThat(moduleResult.getResponse().getContentAsString(StandardCharsets.UTF_8))
            .contains("Фискальный модуль «yz777» уже привязан к кассе №1 (Магазин: «AUR-19 shop»)");
        assertThat(jdbc.queryForList(
            "SELECT cash_register_id FROM cash_register_multikassa_settings "
                + "WHERE LOWER(TRIM(terminal_id)) = 'yz777' OR LOWER(TRIM(module_number)) = 'yz777'",
            Long.class
        )).containsExactly(first);
    }

    // ---- B3 + B4: отчёт о дублях, HALT-precondition, восстановление индексов -----------------------

    @Test
    void reportAndHaltPreconditionFindDuplicatesAcrossRegistersOnly() throws Exception {
        assertThat(validFmIndexes()).containsExactlyElementsOf(FM_INDEXES);

        dropFmIndexesAndForgetV60();
        long r1 = insertRegister(1);
        long r2 = insertRegister(2);
        long r3 = insertRegister(3);
        long r4 = insertRegister(4);
        long r5 = insertRegister(5);
        jdbc.update("UPDATE cash_registers SET fiscal_card_id = 'YZ1' WHERE id = ?", r1);
        jdbc.update("UPDATE cash_registers SET fiscal_card_id = ' yz1 ' WHERE id = ?", r2);
        insertMultikassa(r3, "YZ777", null);
        insertMultikassa(r4, null, "yz777");
        insertMultikassa(r5, "YZ5", "yz5");

        List<Map<String, Object>> report = jdbc.queryForList(sqlResource("db/check_fiscal_module_duplicates.sql"));
        assertThat(report).extracting(row -> row.get("register_id"))
            .containsExactlyInAnyOrder(r1, r2, r3, r4);
        assertThat(report).extracting(row -> row.get("fm_group"))
            .containsOnly("CASH_REGISTER_FISCAL_CARD", "MULTIKASSA_FM_SERIAL");
        assertThat(precondition()).isEqualTo(2);

        assertThatThrownBy(this::runLiquibase)
            .hasStackTraceContaining("AUR-19: найдены ФМ, привязанные к нескольким кассам");
        assertThat(validFmIndexes()).isEmpty();

        jdbc.update("UPDATE cash_registers SET fiscal_card_id = NULL WHERE id = ?", r2);
        jdbc.update("UPDATE cash_register_multikassa_settings SET module_number = NULL WHERE cash_register_id = ?", r4);
        assertThat(jdbc.queryForList(sqlResource("db/check_fiscal_module_duplicates.sql"))).isEmpty();
        assertThat(precondition()).isZero();

        runLiquibase();
        assertThat(validFmIndexes()).containsExactlyElementsOf(FM_INDEXES);
    }

    // ---- B5: индекс как последний рубеж для записи мимо приложения ---------------------------------

    @Test
    void uniqueIndexRejectsDirectSqlDuplicateAndMapsTo409() {
        long r1 = insertRegister(1);
        long r2 = insertRegister(2);
        jdbc.update("UPDATE cash_registers SET fiscal_card_id = 'YZ1' WHERE id = ?", r1);

        DataIntegrityViolationException ex = catchThrowableOfType(
            () -> jdbc.update("UPDATE cash_registers SET fiscal_card_id = ' yz1 ' WHERE id = ?", r2),
            DataIntegrityViolationException.class
        );

        assertThat(ex).hasStackTraceContaining("uq_cash_registers_fm_fiscal_card_id");
        RuntimeException client = DbExceptionTranslator.toClientException(ex);
        assertThat(client).isInstanceOf(ConflictException.class)
            .hasMessage("Фискальный модуль уже привязан к другой кассе");
    }

    // ---- helpers -----------------------------------------------------------------------------------

    private MvcResult putMultikassa(long registerId, String body) {
        try {
            return mvc.perform(put("/admin/cash-registers/{id}/multikassa", registerId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
                .andReturn();
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private boolean waitForBlockedAdvisoryLock() throws InterruptedException {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(30);
        while (System.nanoTime() < deadline) {
            Integer waiting = jdbc.queryForObject(
                "SELECT COUNT(*) FROM pg_locks WHERE locktype = 'advisory' AND NOT granted AND classid = ?",
                Integer.class,
                LOCK_NAMESPACE
            );
            if (waiting != null && waiting > 0) {
                return true;
            }
            TimeUnit.MILLISECONDS.sleep(50);
        }
        return false;
    }

    private List<String> validFmIndexes() {
        List<String> names = new ArrayList<>();
        for (Map<String, Object> row : jdbc.queryForList(sqlResource("db/check_fiscal_module_indexes.sql"))) {
            if (Boolean.TRUE.equals(row.get("is_valid")) && Boolean.TRUE.equals(row.get("is_unique"))) {
                names.add((String) row.get("index_name"));
            }
        }
        return names;
    }

    private void dropFmIndexesAndForgetV60() {
        FM_INDEXES.forEach(index -> jdbc.execute("DROP INDEX " + index));
        jdbc.update("DELETE FROM databasechangelog WHERE id = ?", V60_CHANGESET_ID);
    }

    private int precondition() throws Exception {
        String xml = new String(new ClassPathResource(V60_CHANGELOG).getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        Matcher sql = Pattern.compile("<sqlCheck[^>]*><!\\[CDATA\\[(.*?)]]></sqlCheck>", Pattern.DOTALL).matcher(xml);
        assertThat(sql.find()).isTrue();
        return jdbc.queryForObject(sql.group(1), Integer.class);
    }

    private void runLiquibase() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            var database = DatabaseFactory.getInstance()
                .findCorrectDatabaseImplementation(new JdbcConnection(connection));
            new Liquibase(MASTER_CHANGELOG, new ClassLoaderResourceAccessor(), database)
                .update(new Contexts(), new LabelExpression());
        }
    }

    private static String sqlResource(String path) {
        try {
            return new String(new ClassPathResource(path).getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private int ensureStore() {
        Integer existing = jdbc.query(
            "SELECT id FROM stores WHERE name = 'AUR-19 shop'",
            rs -> rs.next() ? rs.getInt(1) : null
        );
        if (existing != null) {
            return existing;
        }
        Map<String, Object> company = new java.util.LinkedHashMap<>();
        company.put("name", "AUR-19 company");
        company.put("login_code", "aur19");
        company.put("business_type", "GROCERY");
        int companyId = insertWithRequiredColumns("companies", company);
        Map<String, Object> store = new java.util.LinkedHashMap<>();
        store.put("name", "AUR-19 shop");
        store.put("company_id", companyId);
        store.put("is_active", true);
        store.put("business_type", "GROCERY");
        return insertWithRequiredColumns("stores", store);
    }

    /** Заполняет остальные NOT NULL-колонки без default нейтральными значениями: схема — из Liquibase. */
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
        return jdbc.queryForObject(
            "INSERT INTO " + table + " (" + columns + ") VALUES (" + marks + ") RETURNING id",
            Integer.class,
            row.values().toArray()
        );
    }

    private static Object neutralValue(String dataType) {
        return switch (dataType) {
            case "boolean" -> false;
            case "integer", "bigint", "smallint", "numeric" -> 0;
            case "timestamp with time zone", "timestamp without time zone" -> java.sql.Timestamp.from(java.time.Instant.now());
            case "date" -> java.sql.Date.valueOf(java.time.LocalDate.now());
            case "uuid" -> java.util.UUID.randomUUID();
            default -> "aur19";
        };
    }

    private long insertRegister(int number) {
        return jdbc.queryForObject(
            "INSERT INTO cash_registers (store_id, register_number, status) VALUES (?, ?, 'ACTIVE') RETURNING id",
            Long.class,
            storeId,
            number
        );
    }

    private long registerId(int number) {
        return jdbc.queryForObject(
            "SELECT id FROM cash_registers WHERE store_id = ? AND register_number = ?", Long.class, storeId, number
        );
    }

    private void insertMultikassa(long registerId, String terminalId, String moduleNumber) {
        jdbc.update(
            "INSERT INTO cash_register_multikassa_settings (cash_register_id, enabled, base_url, terminal_id, module_number) "
                + "VALUES (?, TRUE, 'http://127.0.0.1:8080', ?, ?)",
            registerId,
            terminalId,
            moduleNumber
        );
    }
}
