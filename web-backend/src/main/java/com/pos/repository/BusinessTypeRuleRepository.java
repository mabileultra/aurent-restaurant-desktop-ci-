package com.pos.repository;

import com.pos.entity.BusinessTypeRule;
import com.pos.entity.BusinessTypeRuleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BusinessTypeRuleRepository extends JpaRepository<BusinessTypeRule, BusinessTypeRuleId> {

    List<BusinessTypeRule> findByBusinessTypeIdOrderByRuleKeyAsc(Integer businessTypeId);

    @Modifying
    @Query("DELETE FROM BusinessTypeRule r WHERE r.businessTypeId = :businessTypeId")
    void deleteByBusinessTypeId(Integer businessTypeId);
}
