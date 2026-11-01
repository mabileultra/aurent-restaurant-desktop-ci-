package com.pos.restaurant.analytics.support;

import com.pos.restaurant.analytics.dto.DashboardFinanceBlock;
import com.pos.restaurant.analytics.dto.DashboardLiveBlock;
import com.pos.restaurant.analytics.dto.DashboardOpsBlock;
import com.pos.restaurant.analytics.dto.DashboardResponse;
import com.pos.restaurant.config.RestaurantExecutorNames;
import com.pos.shared.log.LogUtil;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.UUID;
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
        @Qualifier(RestaurantExecutorNames.DASHBOARD) Executor dashboardExecutor
    ) {
        this.financeLoader = financeLoader;
        this.opsLoader = opsLoader;
        this.liveBuilder = liveBuilder;
        this.dashboardExecutor = dashboardExecutor;
    }

    public DashboardResponse compose(
        Integer companyId,
        Integer storeId,
        String periodKey,
        AnalyticsPeriodResolver.Period period,
        AnalyticsPeriodResolver.Period previous,
        Integer hallId,
        UUID waiterUserId
    ) {
        CompletableFuture<DashboardFinanceBlock> financeFuture = CompletableFuture.supplyAsync(
            () -> financeLoader.load(companyId, storeId, period, previous),
            dashboardExecutor
        );
        CompletableFuture<DashboardOpsBlock> opsFuture = CompletableFuture.supplyAsync(
            () -> opsLoader.load(companyId, storeId),
            dashboardExecutor
        );
        CompletableFuture<DashboardLiveBlock> liveFuture = CompletableFuture.supplyAsync(
            () -> liveBuilder.build(companyId, storeId, hallId, waiterUserId),
            dashboardExecutor
        );

        try {
            CompletableFuture.allOf(financeFuture, opsFuture, liveFuture).join();
            return new DashboardResponse(
                periodKey,
                period.from(),
                period.to(),
                financeFuture.join(),
                opsFuture.join(),
                liveFuture.join()
            );
        } catch (RuntimeException ex) {
            LogUtil.error(
                DashboardParallelComposer.class,
                "Dashboard parallel compose failed storeId=" + storeId,
                ex
            );
            throw ex;
        }
    }
}
