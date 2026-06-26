package com.pos.repository;

import com.pos.entity.FieldDisplayRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FieldDisplayRuleRepository extends JpaRepository<FieldDisplayRule, Integer> {

    List<FieldDisplayRule> findByBusinessTypeIdOrderBySortOrderAscIdAsc(Integer businessTypeId);

    void deleteByBusinessTypeId(Integer businessTypeId);
}
