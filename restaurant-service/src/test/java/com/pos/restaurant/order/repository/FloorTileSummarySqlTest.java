package com.pos.restaurant.order.repository;

import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

import java.lang.reflect.Method;
import java.util.Collection;

import static org.assertj.core.api.Assertions.assertThat;

class FloorTileSummarySqlTest {

    @Test
    void subtotalDropsCancelledLinesAndCountKeepsThem() throws Exception {
        Method method = FloorOrderItemRepository.class.getMethod("summarizeTiles", Collection.class);
        String sql = method.getAnnotation(Query.class).value();
        assertThat(sql).contains("COUNT(*)");
        assertThat(sql).contains("item_status <> 'CANCELLED'");
        assertThat(sql).contains("ROUND(i.quantity * i.unit_price, 2)");
        assertThat(sql).doesNotContain("discount_amount");
        assertThat(sql).doesNotContain("service_amount");
    }
}
