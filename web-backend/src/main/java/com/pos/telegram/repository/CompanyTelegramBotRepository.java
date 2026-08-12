package com.pos.telegram.repository;

import com.pos.telegram.entity.CompanyTelegramBot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompanyTelegramBotRepository extends JpaRepository<CompanyTelegramBot, Long> {

    @Query("select b.company.id from CompanyTelegramBot b where b.apiToken = :apiToken and b.enabled = true")
    Optional<Integer> findCompanyIdByApiTokenAndEnabledTrue(@Param("apiToken") String apiToken);

    Optional<CompanyTelegramBot> findByCompanyId(Integer companyId);

    @Query("select b from CompanyTelegramBot b join fetch b.company where b.enabled = true")
    List<CompanyTelegramBot> findEnabledWithCompany();
}
