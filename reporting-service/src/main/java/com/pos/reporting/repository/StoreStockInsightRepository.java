package com.pos.reporting.repository;

import java.time.LocalDate;
import java.util.List;

public interface StoreStockInsightRepository {

    List<Object[]> stockTotalsByStore(Integer companyId);

    List<Object[]> stockByProductStore(Integer companyId);

    List<Object[]> soldUnitsByProductStore(Integer companyId, LocalDate from, LocalDate to);
}
