package com.pos.reporting.repository.impl;

import com.pos.reporting.repository.StoreStockInsightRepository;
import com.pos.reporting.util.SqlResourceLoader;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class StoreStockInsightRepositoryImpl implements StoreStockInsightRepository {

    private final EntityManager entityManager;
    private final SqlResourceLoader sqlResourceLoader;

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> stockTotalsByStore(Integer companyId) {
        Query query = entityManager.createNativeQuery(
            sqlResourceLoader.load("sql/analytics/store-stock-totals.sql")
        );
        query.setParameter("companyId", companyId);
        return query.getResultList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> stockByProductStore(Integer companyId) {
        Query query = entityManager.createNativeQuery(
            sqlResourceLoader.load("sql/analytics/store-product-stock.sql")
        );
        query.setParameter("companyId", companyId);
        return query.getResultList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> soldUnitsByProductStore(Integer companyId, LocalDate from, LocalDate to) {
        Query query = entityManager.createNativeQuery(
            sqlResourceLoader.load("sql/analytics/sold-units-by-product-store.sql")
        );
        query.setParameter("companyId", companyId);
        query.setParameter("from", from);
        query.setParameter("to", to);
        return query.getResultList();
    }
}
