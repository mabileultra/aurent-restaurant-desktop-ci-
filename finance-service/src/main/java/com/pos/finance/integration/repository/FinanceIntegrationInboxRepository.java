package com.pos.finance.integration.repository;

import com.pos.finance.integration.entity.FinanceIntegrationInbox;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinanceIntegrationInboxRepository extends JpaRepository<FinanceIntegrationInbox, String> {
}
