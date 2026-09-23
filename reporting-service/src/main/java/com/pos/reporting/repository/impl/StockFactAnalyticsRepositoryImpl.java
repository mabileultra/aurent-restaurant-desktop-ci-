package com.pos.reporting.repository.impl;

import com.pos.reporting.repository.StockFactAnalyticsRepository;
import com.pos.reporting.repository.support.NativePageExecutor;
import com.pos.reporting.util.SqlResourceLoader;
import com.pos.reporting.util.NativeQueryParamSupport;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
@RequiredArgsConstructor
public class StockFactAnalyticsRepositoryImpl implements StockFactAnalyticsRepository {

    private final NativePageExecutor nativePageExecutor;
    private final SqlResourceLoader sqlResourceLoader;

    @Override
    public Page<Object[]> balancesPage(
        Integer companyId,
        Integer storeId,
        Integer categoryId,
        String search,
        boolean onlyWithStock,
        Pageable pageable
    ) {
        return nativePageExecutor.fetchPage(
            sqlResourceLoader.load("sql/stock/balances-page.sql"),
            sqlResourceLoader.load("sql/stock/balances-count.sql"),
            query -> bindBalances(query, companyId, storeId, categoryId, search, onlyWithStock),
            pageable
        );
    }

    @Override
    public Page<Object[]> turnoverPage(
        Integer companyId,
        LocalDate from,
        LocalDate to,
        Integer categoryId,
        String search,
        Pageable pageable
    ) {
        return nativePageExecutor.fetchPage(
            sqlResourceLoader.load("sql/stock/turnover-page.sql"),
            sqlResourceLoader.load("sql/stock/turnover-count.sql"),
            query -> bindTurnover(query, companyId, from, to, categoryId, search),
            pageable
        );
    }

    @Override
    public Page<Object[]> deadStockPage(
        Integer companyId,
        LocalDate asOfDate,
        LocalDate cutoffDate,
        int daysNoSale,
        Integer categoryId,
        String search,
        Pageable pageable
    ) {
        return nativePageExecutor.fetchPage(
            sqlResourceLoader.load("sql/stock/dead-stock-page.sql"),
            sqlResourceLoader.load("sql/stock/dead-stock-count.sql"),
            query -> bindDeadStock(query, companyId, asOfDate, cutoffDate, daysNoSale, categoryId, search),
            pageable
        );
    }

    @Override
    public Page<Object[]> lowStockPage(Integer companyId, Pageable pageable) {
        return nativePageExecutor.fetchPage(
            sqlResourceLoader.load("sql/stock/low-stock-page.sql"),
            sqlResourceLoader.load("sql/stock/low-stock-count.sql"),
            query -> {
                query.setParameter("companyId", companyId);
                // count SQL shared with dashboard requires :storeId; null → all stores
                NativeQueryParamSupport.bindOptionalStoreId(query, "storeId", null);
            },
            pageable
        );
    }

    private static void bindBalances(
        Query query,
        Integer companyId,
        Integer storeId,
        Integer categoryId,
        String search,
        boolean onlyWithStock
    ) {
        NativeQueryParamSupport.setParameterIfPresent(query, "companyId", companyId);
        NativeQueryParamSupport.bindOptionalStoreId(query, "storeId", storeId);
        NativeQueryParamSupport.bindOptionalCategoryId(query, "categoryId", categoryId);
        NativeQueryParamSupport.setParameterIfPresent(
            query, "searchPattern", NativeQueryParamSupport.toContainsPattern(search)
        );
        NativeQueryParamSupport.setParameterIfPresent(
            query, "onlyWithStock", NativeQueryParamSupport.booleanFlag(onlyWithStock)
        );
    }

    private static void bindTurnover(
        Query query,
        Integer companyId,
        LocalDate from,
        LocalDate to,
        Integer categoryId,
        String search
    ) {
        NativeQueryParamSupport.setParameterIfPresent(query, "companyId", companyId);
        NativeQueryParamSupport.setParameterIfPresent(query, "from", from);
        NativeQueryParamSupport.setParameterIfPresent(query, "to", to);
        NativeQueryParamSupport.bindOptionalCategoryId(query, "categoryId", categoryId);
        NativeQueryParamSupport.setParameterIfPresent(
            query, "searchPattern", NativeQueryParamSupport.toContainsPattern(search)
        );
    }

    private static void bindDeadStock(
        Query query,
        Integer companyId,
        LocalDate asOfDate,
        LocalDate cutoffDate,
        int daysNoSale,
        Integer categoryId,
        String search
    ) {
        NativeQueryParamSupport.setParameterIfPresent(query, "companyId", companyId);
        NativeQueryParamSupport.setParameterIfPresent(query, "asOfDate", asOfDate);
        NativeQueryParamSupport.setParameterIfPresent(query, "cutoffDate", cutoffDate);
        NativeQueryParamSupport.setParameterIfPresent(query, "daysNoSale", daysNoSale);
        NativeQueryParamSupport.bindOptionalCategoryId(query, "categoryId", categoryId);
        NativeQueryParamSupport.setParameterIfPresent(
            query, "searchPattern", NativeQueryParamSupport.toContainsPattern(search)
        );
    }
}
