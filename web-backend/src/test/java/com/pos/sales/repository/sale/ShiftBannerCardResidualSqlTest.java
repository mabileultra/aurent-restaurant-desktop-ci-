package com.pos.sales.repository.sale;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guard: «Карта» в X/Z не должна включать Humo/Uzcard/CASHLESS (иначе двойной учёт на чеке).
 */
class ShiftBannerCardResidualSqlTest {

    @Test
    void bannerByShiftId_excludesHumoUzcardAndCashlessFromCardTotal() throws IOException {
        String sql = readClasspath("sql/sales/aggregate-shift-banner-by-shift-id.sql");
        assertThat(sql).contains("payment_method = 'CASHLESS' THEN 0");
        assertThat(sql).contains("IN ('HUMO', 'UZCARD', 'PAYME') THEN 0");
        assertThat(sql).contains("card_type = 'PAYME'");
        assertThat(sql).contains("ELSE net.card_amount");
    }

    @Test
    void bannerByCashierTime_excludesHumoUzcardAndCashlessFromCardTotal() throws IOException {
        String sql = readClasspath("sql/sales/aggregate-shift-banner-by-cashier-time.sql");
        assertThat(sql).contains("payment_method = 'CASHLESS' THEN 0");
        assertThat(sql).contains("IN ('HUMO', 'UZCARD', 'PAYME') THEN 0");
        assertThat(sql).contains("card_type = 'PAYME'");
        assertThat(sql).contains("ELSE net.card_amount");
    }

    @Test
    void returnsByShiftId_excludesCashlessFromCardTotal() throws IOException {
        String sql = readClasspath("sql/sales/aggregate-returns-by-shift-id.sql");
        assertThat(sql).contains("payment_method = 'CASHLESS' THEN 0");
        assertThat(sql).contains("IN ('HUMO', 'UZCARD') THEN 0");
    }

    @Test
    void returnsByCashierTime_excludesCashlessFromCardTotal() throws IOException {
        String sql = readClasspath("sql/sales/aggregate-returns-by-cashier-time.sql");
        assertThat(sql).contains("payment_method = 'CASHLESS' THEN 0");
        assertThat(sql).contains("IN ('HUMO', 'UZCARD') THEN 0");
    }

    private static String readClasspath(String path) throws IOException {
        try (var in = Thread.currentThread().getContextClassLoader().getResourceAsStream(path)) {
            assertThat(in).as(path).isNotNull();
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
