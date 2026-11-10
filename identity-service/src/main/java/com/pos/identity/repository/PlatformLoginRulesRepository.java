package com.pos.identity.repository;

import com.pos.identity.entity.PlatformLoginRules;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformLoginRulesRepository extends JpaRepository<PlatformLoginRules, Integer> {
}
