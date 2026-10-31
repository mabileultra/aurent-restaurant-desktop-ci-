package com.pos.restaurant.analytics.service;

import com.pos.restaurant.analytics.dto.ActivityEventResponse;
import com.pos.restaurant.analytics.dto.DashboardResponse;
import com.pos.restaurant.analytics.dto.SalesReportResponse;
import com.pos.shared.api.PageResponse;

import java.time.Instant;
import java.util.UUID;

public interface RestaurantAnalyticsService {

    DashboardResponse dashboard(
        Integer storeId,
        String periodKey,
        Instant from,
        Instant to,
        Integer hallId,
        UUID waiterUserId
    );

    SalesReportResponse salesReport(Integer storeId, Instant from, Instant to);

    PageResponse<ActivityEventResponse> activity(
        Integer storeId,
        Instant from,
        Instant to,
        int page,
        int size,
        String type,
        String search
    );
}
