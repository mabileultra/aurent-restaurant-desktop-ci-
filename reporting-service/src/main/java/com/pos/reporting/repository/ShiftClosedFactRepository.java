package com.pos.reporting.repository;

import com.pos.reporting.entity.ShiftClosedFact;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShiftClosedFactRepository extends JpaRepository<ShiftClosedFact, Long> {
}
