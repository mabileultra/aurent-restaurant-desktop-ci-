package com.pos.restaurant.print.repository;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.lang.reflect.Method;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/** A desktop back after hours must not print the backlog: old pending jobs are closed unprinted. */
@Testcontainers(disabledWithoutDocker = true)
class PrintJobExpirySqlTest {

    private static final PostgreSQLContainer<?> PG = new PostgreSQLContainer<>("postgres:15-alpine");
    private static HikariDataSource pool;
    private static NamedParameterJdbcTemplate jdbc;

    @BeforeAll
    static void startDb() {
        PG.start();
        pool = new HikariDataSource();
        pool.setJdbcUrl(PG.getJdbcUrl());
        pool.setUsername(PG.getUsername());
        pool.setPassword(PG.getPassword());
        jdbc = new NamedParameterJdbcTemplate(pool);
        jdbc.getJdbcTemplate().execute("""
            CREATE TABLE restaurant_print_jobs (
                id UUID PRIMARY KEY,
                company_id INT NOT NULL,
                store_id INT NOT NULL,
                kind VARCHAR(32) NOT NULL,
                payload TEXT NOT NULL,
                status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                completed_at TIMESTAMP WITH TIME ZONE,
                claimed_at TIMESTAMP WITH TIME ZONE
            )
            """);
    }

    @AfterAll
    static void stopDb() {
        pool.close();
        PG.stop();
    }

    @Test
    void closesOldBillsAfter5MinAndOldSlipsAfter20MinWithoutTouchingFreshOrOtherStores() {
        Instant now = Instant.parse("2026-10-01T22:00:00Z");
        UUID oldBill = insert(1, "GUEST_BILL", "PENDING", now.minus(Duration.ofMinutes(6)));
        UUID freshBill = insert(1, "GUEST_BILL", "PENDING", now.minus(Duration.ofMinutes(4)));
        UUID oldSlip = insert(1, "CATEGORY_SLIP", "PENDING", now.minus(Duration.ofHours(6)));
        UUID oldKitchen = insert(1, "KITCHEN_SEND", "PENDING", now.minus(Duration.ofMinutes(21)));
        UUID freshSlip = insert(1, "CATEGORY_SLIP", "PENDING", now.minus(Duration.ofMinutes(10)));
        UUID claimed = insert(1, "CATEGORY_SLIP", "CLAIMED", now.minus(Duration.ofHours(1)));
        UUID otherStore = insert(2, "GUEST_BILL", "PENDING", now.minus(Duration.ofHours(1)));

        int closed = jdbc.update(querySql("expireStalePending"), new MapSqlParameterSource()
            .addValue("companyId", 7)
            .addValue("storeId", 1)
            .addValue("billBefore", Timestamp.from(now.minus(Duration.ofMinutes(5))))
            .addValue("slipBefore", Timestamp.from(now.minus(Duration.ofMinutes(20))))
            .addValue("now", Timestamp.from(now)));

        assertThat(closed).isEqualTo(3);
        assertThat(status(oldBill)).isEqualTo("DONE");
        assertThat(status(oldSlip)).isEqualTo("DONE");
        assertThat(status(oldKitchen)).isEqualTo("DONE");
        assertThat(status(freshBill)).isEqualTo("PENDING");
        assertThat(status(freshSlip)).isEqualTo("PENDING");
        assertThat(status(claimed)).isEqualTo("CLAIMED");
        assertThat(status(otherStore)).isEqualTo("PENDING");
    }

    private UUID insert(int storeId, String kind, String status, Instant createdAt) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
            INSERT INTO restaurant_print_jobs (id, company_id, store_id, kind, payload, status, created_at)
            VALUES (:id, 7, :store, :kind, '{}', :status, :createdAt)
            """, new MapSqlParameterSource()
            .addValue("id", id)
            .addValue("store", storeId)
            .addValue("kind", kind)
            .addValue("status", status)
            .addValue("createdAt", Timestamp.from(createdAt)));
        return id;
    }

    private String status(UUID id) {
        return jdbc.queryForObject(
            "SELECT status FROM restaurant_print_jobs WHERE id = :id",
            Map.of("id", id),
            String.class
        );
    }

    private static String querySql(String methodName) {
        for (Method method : RestaurantPrintJobRepository.class.getDeclaredMethods()) {
            if (method.getName().equals(methodName)) {
                return method.getAnnotation(Query.class).value();
            }
        }
        throw new IllegalStateException("No @Query " + methodName);
    }
}
