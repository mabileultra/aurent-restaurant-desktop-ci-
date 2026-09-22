package com.pos.restaurant.analytics.support;

import com.pos.restaurant.analytics.dto.DashboardResponse;
import com.pos.shared.log.LogUtil;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

/**
 * Composes dashboard slices in parallel (finance / ops / live).
 * Each loader opens its own REQUIRES_NEW read transaction — safe for JPA.
 */
@Component
public class DashboardParallelComposer {

    private final DashboardFinanceSliceLoader financeLoader;
    private final DashboardOpsSliceLoader opsLoader;
    private final DashboardLiveSnapshotBuilder liveBuilder;
    private final Executor dashboardExecutor;

    public DashboardParallelComposer(
        DashboardFinanceSliceLoader financeLoader,
        DashboardOpsSliceLoader opsLoader,
        DashboardLiveSnapshotBuilder liveBuilder,
        @Qualifier("dashboardExecutor") Executor dashboardExecutor
    ) {
        this.financeLoader = financeLoader;
        this.opsLoader = opsLoader;
        this.liveBuilder = liveBuilder;
        this.dashboardExecutor = dashboardExecutor;
    }

    public DashboardResponse compose(
        Integer companyId,
        Integer storeId,
        AnalyticsPeriodResolver.Period period,
        AnalyticsPeriodResolver.Period previous
    ) {
        CompletableFuture<DashboardFinanceSliceLoader.FinanceSlice> financeFuture = CompletableFuture.supplyAsync(
            () -> financeLoader.load(companyId, storeId, period, previous),
            dashboardExecutor
        );
        CompletableFuture<DashboardOpsSliceLoader.OpsSlice> opsFuture = CompletableFuture.supplyAsync(
            () -> opsLoader.load(companyId, storeId),
            dashboardExecutor
        );
        CompletableFuture<DashboardLiveSnapshotBuilder.LiveSnapshot> liveFuture = CompletableFuture.supplyAsync(
            () -> liveBuilder.build(companyId, storeId),
            dashboardExecutor
        );

        try {
            CompletableFuture.allOf(financeFuture, opsFuture, liveFuture).join();
            return merge(period, financeFuture.join(), opsFuture.join(), liveFuture.join());
        } catch (RuntimeException ex) {
            LogUtil.error(
                DashboardParallelComposer.class,
                "Dashboard parallel compose failed storeId=" + storeId,
                ex
            );
            throw ex;
        }
    }

    private static DashboardResponse merge(
        AnalyticsPeriodResolver.Period period,
        DashboardFinanceSliceLoader.FinanceSlice finance,
        DashboardOpsSliceLoader.OpsSlice ops,
        DashboardLiveSnapshotBuilder.LiveSnapshot live
    ) {
        return new DashboardResponse(
            period.from(),
            period.to(),
            finance.revenue(),
            finance.previousRevenue(),
            finance.revenueDeltaPct(),
            finance.cashAmount(),
            finance.cardAmount(),
            finance.closedOrders(),
            finance.previousClosedOrders(),
            finance.closedOrdersDelta(),
            ops.openOrders(),
            finance.cancelledOrders(),
            finance.averageCheck(),
            finance.previousAverageCheck(),
            finance.averageCheckDeltaPct(),
            finance.guests(),
            ops.occupiedTables(),
            ops.freeTables(),
            ops.waitingPaymentTables(),
            ops.reservedTables(),
            ops.blockedTables(),
            ops.totalTables(),
            ops.kitchenNew(),
            ops.kitchenPreparing(),
            ops.kitchenReady(),
            ops.kitchenWaiting(),
            ops.reservationsActive(),
            ops.shiftOpen(),
            ops.shiftRevenue(),
            ops.shiftSaleCount(),
            false,
            null,
            null,
            null,
            finance.byHour(),
            finance.byDish(),
            live.tables(),
            live.kitchen(),
            live.recentOrders()
        );
    }
}
