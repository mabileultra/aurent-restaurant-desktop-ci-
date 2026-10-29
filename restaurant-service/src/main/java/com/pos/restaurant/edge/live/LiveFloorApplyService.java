package com.pos.restaurant.edge.live;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.revision.FloorRevisionBump;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * Apply live floor slice — orchestration only.
 * Upserts: {@link LiveFloorUpsertWriter}; ghost close: {@link LiveFloorGhostReconcile}.
 */
@Service
@RequiredArgsConstructor
public class LiveFloorApplyService {

    private final LiveFloorUpsertWriter upserts;
    private final LiveFloorGhostReconcile ghosts;
    private final LiveServicePercentApply servicePercentApply;
    private final LiveShiftReconcile shiftReconcile;
    private final FloorRevisionBump floorRevision;

    @Transactional
    public Map<String, Object> applyLive(EdgeCatalogSnapshot snap) {
        return applyLive(snap, true);
    }

    /**
     * @param reconcileGhosts when true, OPEN/BILLING absent from snapshot are closed (hall→cloud).
     *                        when false, LWW upsert-only (cloud→edge pull).
     */
    @Transactional
    public Map<String, Object> applyLive(EdgeCatalogSnapshot snap, boolean reconcileGhosts) {
        if (snap == null || snap.companyId() == null || snap.storeId() == null) {
            throw new BusinessException("Invalid live snapshot");
        }
        boolean forceOverwrite = reconcileGhosts;
        int servicePercents = reconcileGhosts ? 0 : servicePercentApply.apply(snap);
        int orders = upserts.upsertOrders(snap, snap.openOrders(), forceOverwrite);
        int items = upserts.upsertItems(snap.openOrderItems(), forceOverwrite);
        int links = upserts.upsertLinks(snap.openOrderLinks());
        int mods = upserts.upsertMods(snap.openOrderItemModifiers());
        int closedOrders = upserts.upsertOrders(snap, snap.closedOrders(), forceOverwrite);
        int closedItems = upserts.upsertItems(snap.closedOrderItems(), forceOverwrite);
        int closedMods = upserts.upsertMods(snap.closedOrderItemModifiers());
        int tickets = upserts.upsertTickets(snap, forceOverwrite);
        int ticketLines = upserts.upsertTicketLines(snap);
        int payments = upserts.upsertPayments(snap);
        int closedGhosts = reconcileGhosts ? ghosts.reconcileOpen(snap) : 0;
        int staleTickets = reconcileGhosts ? ghosts.reconcileTickets(snap) : 0;
        // After floor upsert (+ hall ghost close): align shift both ways (Phase C).
        int openShift = shiftReconcile.apply(snap);
        floorRevision.noteRemote(snap.companyId(), snap.storeId(), snap.floorRevision());
        // Phase D: edge pull must move local watermark so POS/kitchen polls refresh
        // even when remote origin is 0 or unchanged after LWW upserts.
        int touched = servicePercents + orders + items + links + mods
            + closedOrders + closedItems + closedMods
            + tickets + ticketLines + payments
            + closedGhosts + staleTickets + openShift;
        if (!reconcileGhosts && touched > 0) {
            floorRevision.bump(snap.companyId(), snap.storeId());
        }

        Map<String, Object> out = new HashMap<>();
        out.put("servicePercents", servicePercents);
        out.put("openShift", openShift);
        out.put("openOrders", orders);
        out.put("openOrderItems", items);
        out.put("openOrderLinks", links);
        out.put("openOrderItemModifiers", mods);
        out.put("closedOrders", closedOrders);
        out.put("closedOrderItems", closedItems);
        out.put("closedOrderItemModifiers", closedMods);
        out.put("kitchenTickets", tickets);
        out.put("kitchenTicketLines", ticketLines);
        out.put("orderPayments", payments);
        out.put("closedGhostOrders", closedGhosts);
        out.put("cancelledStaleTickets", staleTickets);
        out.put("companyId", snap.companyId());
        out.put("storeId", snap.storeId());
        out.put("reconcileGhosts", reconcileGhosts);
        return out;
    }
}
