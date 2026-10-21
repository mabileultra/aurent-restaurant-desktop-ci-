package com.pos.restaurant.edge.live;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;

import java.util.List;

/** Strip heavy catalog fields — live sync only needs floor / kitchen / payments. */
public final class LiveFloorSlice {

    private LiveFloorSlice() {}

    public static EdgeCatalogSnapshot of(EdgeCatalogSnapshot full) {
        if (full == null) return null;
        return new EdgeCatalogSnapshot(
            full.companyId(),
            full.storeId(),
            full.companyLoginCode(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            null,
            List.of(),
            List.of(),
            full.openShift(),
            full.openOrders(),
            full.openOrderItems(),
            full.openOrderLinks(),
            full.openOrderItemModifiers(),
            full.kitchenTickets(),
            full.kitchenTicketLines(),
            null,
            null,
            null,
            full.orderPayments()
        );
    }
}
