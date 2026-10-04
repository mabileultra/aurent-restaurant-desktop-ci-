package com.pos.restaurant.shift.support;

import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.dto.ShiftItemRow;
import com.pos.restaurant.shift.entity.RestaurantShift;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ShiftItemSalesLoaderTest {

    private static final Instant OPENED = Instant.parse("2026-10-01T03:00:00Z");
    private static final Instant CLOSED = Instant.parse("2026-10-01T22:00:00Z");

    private EntityManager em;
    private Query query;
    private ShiftItemSalesLoader loader;

    @BeforeEach
    void setUp() {
        em = mock(EntityManager.class);
        query = mock(Query.class);
        when(em.createQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        loader = new ShiftItemSalesLoader();
        ReflectionTestUtils.setField(loader, "em", em);
    }

    private static RestaurantShift shift(Instant closedAt) {
        return RestaurantShift.builder()
            .id(UUID.randomUUID())
            .companyId(7)
            .storeId(3)
            .openedByUserId(UUID.randomUUID())
            .status(closedAt == null ? RestaurantShiftStatus.OPEN : RestaurantShiftStatus.CLOSED)
            .openedAt(OPENED)
            .closedAt(closedAt)
            .build();
    }

    @Test
    void openShiftCountsPaidOrdersUpToNow() {
        when(query.getResultList()).thenReturn(List.of());
        Instant now = Instant.parse("2026-10-01T15:00:00Z");

        loader.load(shift(null), now);

        verify(query).setParameter("companyId", 7);
        verify(query).setParameter("storeId", 3);
        verify(query).setParameter("closed", OrderStatus.CLOSED);
        verify(query).setParameter("cancelled", OrderItemStatus.CANCELLED);
        verify(query).setParameter("from", OPENED);
        verify(query).setParameter("to", now);
    }

    @Test
    void closedShiftUsesItsCloseTimeNotTheReportTime() {
        when(query.getResultList()).thenReturn(List.of());

        loader.load(shift(CLOSED), Instant.parse("2026-10-02T09:00:00Z"));

        verify(query).setParameter(eq("to"), eq(CLOSED));
    }

    @Test
    void mapsRowsAndScalesNumbers() {
        List<Object[]> raw = List.of(
            new Object[] {"Горячее", "Лагман", new BigDecimal("12"), new BigDecimal("360000")},
            new Object[] {"Напитки", "Чай", 30L, 90000.5d}
        );
        when(query.getResultList()).thenReturn(raw);

        List<ShiftItemRow> rows = loader.load(shift(CLOSED), CLOSED);

        assertEquals(2, rows.size());
        assertEquals(new ShiftItemRow("Горячее", "Лагман", new BigDecimal("12.00"), new BigDecimal("360000.00")), rows.get(0));
        assertEquals(new ShiftItemRow("Напитки", "Чай", new BigDecimal("30.00"), new BigDecimal("90000.50")), rows.get(1));
    }

    @Test
    void emptyShiftReturnsEmptyList() {
        when(query.getResultList()).thenReturn(List.of());

        assertTrue(loader.load(shift(null), Instant.now()).isEmpty());
    }

    @Test
    void queryJoinsMenuCategoryForGrouping() {
        when(query.getResultList()).thenReturn(List.of());

        loader.load(shift(CLOSED), CLOSED);

        org.mockito.ArgumentCaptor<String> jpql = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(em).createQuery(jpql.capture());
        String sql = jpql.getValue();
        assertTrue(sql.contains("MenuCategory"));
        assertTrue(sql.contains("group by coalesce(c.name, m.category, ''), i.name"));
        assertTrue(sql.contains("order by min(coalesce(c.sortOrder, 9999))"));
    }

    @Test
    void blankCategoryNameIsNormalizedToEmpty() {
        List<Object[]> raw = new java.util.ArrayList<>();
        raw.add(new Object[] {"  ", "Самса", new BigDecimal("1"), new BigDecimal("8000")});
        when(query.getResultList()).thenReturn(raw);

        List<ShiftItemRow> rows = loader.load(shift(CLOSED), CLOSED);

        assertEquals(1, rows.size());
        assertEquals("", rows.get(0).categoryName());
        assertEquals("Самса", rows.get(0).name());
    }
}
