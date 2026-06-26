package com.pos.reporting.repository.impl;

import com.pos.reporting.repository.StockDashboardFactsRepository;
import com.pos.reporting.util.NativeQueryParamSupport;
import com.pos.reporting.util.SqlResourceLoader;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class StockDashboardFactsRepositoryImpl implements StockDashboardFactsRepository {

    private final EntityManager entityManager;
    private final SqlResourceLoader sqlResourceLoader;

    @Override
    public Object[] writeOffTotals(Integer companyId, LocalDate from, LocalDate to, Integer storeId) {
        Query query = entityManager.createNativeQuery(
            sqlResourceLoader.load("sql/stock/dashboard-write-off-totals.sql")
        );
        bindPeriod(query, companyId, from, to, storeId);
        return (Object[]) query.getSingleResult();
    }

    @Override
    public Object[] currentStockTotals(Integer companyId) {
        Query query = entityManager.createNativeQuery(
            sqlResourceLoader.load("sql/stock/dashboard-current-stock-totals.sql")
        );
        query.setParameter("companyId", companyId);
        return (Object[]) query.getSingleResult();
    }

    @Override
    public long countLowStockSkus(Integer companyId) {
        Query query = entityManager.createNativeQuery(
            sqlResourceLoader.load("sql/stock/low-stock-count.sql")
        );
        query.setParameter("companyId", companyId);
        Number total = (Number) query.getSingleResult();
        return total != null ? total.longValue() : 0L;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> dailyWriteOffUnits(Integer companyId, LocalDate from, LocalDate to, Integer storeId) {
        Query query = entityManager.createNativeQuery(
            sqlResourceLoader.load("sql/stock/dashboard-daily-write-off.sql")
        );
        bindPeriod(query, companyId, from, to, storeId);
        return query.getResultList();
    }

    private static void bindPeriod(
        Query query,
        Integer companyId,
        LocalDate from,
        LocalDate to,
        Integer storeId
    ) {
        query.setParameter("companyId", companyId);
        query.setParameter("from", from);
        query.setParameter("to", to);
        NativeQueryParamSupport.bindOptionalStoreId(query, "storeId", storeId);
    }
}
