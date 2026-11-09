package com.pos.taxanalytics.support;

import com.pos.taxanalytics.client.TaxAnalyticsPharmacyClient;
import com.pos.taxanalytics.client.TaxAnalyticsRestaurantClient;
import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalProductDto;
import com.pos.taxanalytics.dto.TaxAnalyticsCompanyProductResponse;
import com.pos.taxanalytics.repository.TaxAnalyticsCompanyQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Grocery sale_items first; restaurant/pharmacy vertical products when grocery is empty. */
@Component
@RequiredArgsConstructor
public class TaxAnalyticsCompanyProductsLoader {

    private final TaxAnalyticsCompanyQueryRepository repository;
    private final TaxAnalyticsRestaurantClient restaurantClient;
    private final TaxAnalyticsPharmacyClient pharmacyClient;

    public List<TaxAnalyticsCompanyProductResponse> load(int companyId, TaxAnalyticsPeriod range) {
        List<TaxAnalyticsCompanyProductResponse> grocery = mapRows(repository.topProducts(companyId, range, 200));
        if (!grocery.isEmpty()) {
            return grocery;
        }
        List<TaxAnalyticsVerticalProductDto> restaurant = restaurantClient.topProducts(
            companyId, range.from(), range.to(), 200
        );
        if (restaurant != null && !restaurant.isEmpty()) {
            return mapVertical(restaurant);
        }
        return mapVertical(pharmacyClient.topProducts(companyId, range.from(), range.to(), 200));
    }

    private static List<TaxAnalyticsCompanyProductResponse> mapRows(List<Map<String, Object>> rows) {
        List<TaxAnalyticsCompanyProductResponse> products = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            products.add(new TaxAnalyticsCompanyProductResponse(
                text(row.get("product_name")),
                TaxAnalyticsWeekMath.decimal(row.get("quantity")),
                TaxAnalyticsWeekMath.decimal(row.get("amount"))
            ));
        }
        return products;
    }

    private static List<TaxAnalyticsCompanyProductResponse> mapVertical(List<TaxAnalyticsVerticalProductDto> rows) {
        List<TaxAnalyticsCompanyProductResponse> products = new ArrayList<>();
        if (rows == null) {
            return products;
        }
        for (TaxAnalyticsVerticalProductDto row : rows) {
            if (row == null) {
                continue;
            }
            products.add(new TaxAnalyticsCompanyProductResponse(
                row.productName() == null || row.productName().isBlank() ? "—" : row.productName(),
                TaxAnalyticsWeekMath.decimal(row.quantity()),
                TaxAnalyticsWeekMath.decimal(row.amount())
            ));
        }
        return products;
    }

    private static String text(Object value) {
        return value == null ? "—" : String.valueOf(value);
    }
}
