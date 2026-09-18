package com.pos.finance.integration.service.impl;

import com.pos.finance.integration.entity.FinanceIntegrationInbox;
import com.pos.finance.integration.repository.FinanceIntegrationInboxRepository;
import com.pos.finance.integration.service.FinanceIntegrationInboxService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class FinanceIntegrationInboxServiceImpl implements FinanceIntegrationInboxService {

    private final FinanceIntegrationInboxRepository repository;

    @Override
    @Transactional(readOnly = true)
    public boolean alreadyProcessed(String idempotencyKey) {
        if (!StringUtils.hasText(idempotencyKey)) {
            return false;
        }
        return repository.existsById(idempotencyKey.trim());
    }

    @Override
    @Transactional
    public void markProcessed(String idempotencyKey, String eventType) {
        if (!StringUtils.hasText(idempotencyKey)) {
            return;
        }
        String key = idempotencyKey.trim();
        if (repository.existsById(key)) {
            return;
        }
        try {
            repository.save(FinanceIntegrationInbox.builder()
                .idempotencyKey(key)
                .eventType(eventType)
                .processedAt(Instant.now())
                .build());
        } catch (DataIntegrityViolationException ex) {
            LogUtil.debug(
                FinanceIntegrationInboxServiceImpl.class,
                "Inbox mark race key={}",
                key
            );
        }
    }
}
