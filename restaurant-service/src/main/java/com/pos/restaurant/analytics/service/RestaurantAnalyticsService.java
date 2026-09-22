package com.pos.restaurant.analytics.service;

import com.pos.restaurant.analytics.dto.ActivityEventResponse;
import com.pos.restaurant.analytics.dto.DashboardResponse;
import com.pos.restaurant.analytics.dto.SalesReportResponse;

import java.time.Instant;
import java.util.List;

public interface RestaurantAnalyticsService {

    DashboardResponse dashboard(Integer storeId, String periodKey, Instant from, Instant to);

    SalesReportResponse salesReport(Integer storeId, Instant from, Instant to);

    List<ActivityEventResponse> activity(Integer storeId, Instant from, Instant to);
}
