package com.pos.catalog.service;

import com.pos.catalog.entity.CatalogOutbox;
import com.pos.catalog.event.CatalogOutboxPublisher;
import com.pos.catalog.repository.CatalogOutboxRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogOutboxDispatchService {

    private static final int MAX_ERROR_LEN = 2000;

    private final CatalogOutboxRepository outboxRepository;
    private final CatalogOutboxPublisher outboxPublisher;

    @Transactional
    public int dispatchBatch(int limit) {
        int size = Math.min(Math.max(limit, 1), 200);
        List<CatalogOutbox> pending = outboxRepository.findByStatusOrderByCreatedAtAsc(
            "PENDING",
            PageRequest.of(0, size)
        );
        int published = 0;
        for (CatalogOutbox row : pending) {
            if (dispatchOne(row)) {
                published++;
            }
        }
        if (!pending.isEmpty()) {
            LogUtil.info(
                CatalogOutboxDispatchService.class,
                "catalog outbox dispatch batch size={} published={}",
                pending.size(),
                published
            );
        }
        return published;
    }

    private boolean dispatchOne(CatalogOutbox row) {
        row.setAttempts(row.getAttempts() + 1);
        try {
            outboxPublisher.publish(row);
            row.setStatus("PUBLISHED");
            row.setPublishedAt(Instant.now());
            row.setLastError(null);
            outboxRepository.save(row);
            return true;
        } catch (Exception ex) {
            row.setStatus("FAILED");
            row.setLastError(truncate(ex.getMessage()));
            outboxRepository.save(row);
            LogUtil.warn(
                CatalogOutboxDispatchService.class,
                "catalog outbox publish failed id=" + row.getId(),
                ex
            );
            return false;
        }
    }

    private static String truncate(String message) {
        if (message == null) {
            return "unknown error";
        }
        return message.length() <= MAX_ERROR_LEN ? message : message.substring(0, MAX_ERROR_LEN);
    }
}
