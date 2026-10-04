package com.pos.restaurant.print.repository;

import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guards the Hibernate + Postgres trap: {@code payload::json} becomes {@code payload:json}
 * and claim SQL 500s — desktop print / Alinur-style multi-printer stores break.
 */
class PrintJobClaimSqlShapeTest {

    @Test
    void filteredClaimUsesCastNotColonColonJson() throws Exception {
        Method method = RestaurantPrintJobRepository.class.getDeclaredMethod(
            "claimPendingFilteredIds",
            Integer.class,
            Integer.class,
            java.time.Instant.class,
            java.time.Instant.class,
            int.class,
            int.class,
            int.class, // guestBill
            int.class, // orderCancel
            int.class, // kitchenSend
            int.class, // hasPrinters
            java.util.Collection.class,
            java.util.Collection.class
        );
        String sql = method.getAnnotation(Query.class).value();
        assertThat(sql).containsIgnoringCase("CAST(payload AS json)");
        assertThat(sql).doesNotContain("payload::json");
        assertThat(sql).doesNotContain("payload:json");
    }
}
