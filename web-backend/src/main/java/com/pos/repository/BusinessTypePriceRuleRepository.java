package com.pos.repository;

import com.pos.entity.BusinessTypePriceRule;
import com.pos.entity.BusinessTypePriceRuleId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BusinessTypePriceRuleRepository extends JpaRepository<BusinessTypePriceRule, BusinessTypePriceRuleId> {

    List<BusinessTypePriceRule> findByBusinessTypeIdOrderByRuleKeyAsc(Integer businessTypeId);

    void deleteByBusinessTypeId(Integer businessTypeId);
}
