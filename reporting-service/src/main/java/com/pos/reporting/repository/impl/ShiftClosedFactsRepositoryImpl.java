package com.pos.reporting.repository.impl;

import com.pos.reporting.entity.ShiftClosedFact;
import com.pos.reporting.repository.ShiftClosedFactsRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class ShiftClosedFactsRepositoryImpl implements ShiftClosedFactsRepository {

    private final EntityManager entityManager;

    @Override
    public Object[] summarizePeriod(Integer companyId, LocalDate from, LocalDate to) {
        return (Object[]) entityManager.createQuery("""
            SELECT COUNT(s), COALESCE(SUM(s.totalSales), 0)
            FROM ShiftClosedFact s
            WHERE s.companyId = :companyId
              AND s.businessDate BETWEEN :from AND :to
            """)
            .setParameter("companyId", companyId)
            .setParameter("from", from)
            .setParameter("to", to)
            .getSingleResult();
    }

    @Override
    public long countByCompany(Integer companyId) {
        Long total = entityManager.createQuery("""
            SELECT COUNT(s)
            FROM ShiftClosedFact s
            WHERE s.companyId = :companyId
            """, Long.class)
            .setParameter("companyId", companyId)
            .getSingleResult();
        return total != null ? total : 0L;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<ShiftClosedFact> findRecent(Integer companyId, int limit) {
        return entityManager.createQuery("""
            SELECT s
            FROM ShiftClosedFact s
            WHERE s.companyId = :companyId
            ORDER BY COALESCE(s.closedAt, s.ingestedAt) DESC
            """, ShiftClosedFact.class)
            .setParameter("companyId", companyId)
            .setMaxResults(Math.max(1, limit))
            .getResultList();
    }
}
