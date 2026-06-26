package com.pos.reporting.repository;

import com.pos.reporting.entity.ShiftClosedFact;

import java.time.LocalDate;
import java.util.List;

public interface ShiftClosedFactsRepository {

    Object[] summarizePeriod(Integer companyId, LocalDate from, LocalDate to);

    long countByCompany(Integer companyId);

    List<ShiftClosedFact> findRecent(Integer companyId, int limit);
}
