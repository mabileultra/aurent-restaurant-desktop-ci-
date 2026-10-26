package com.pos.restaurant.floor.revision;

import com.pos.restaurant.config.RestaurantHotCache;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.HashSet;
import java.util.Set;

/**
 * One increment per company and store inside a single transaction.
 * The cache is dropped only after commit, so a rollback leaves both the row and the cache alone.
 */
@Component
@RequiredArgsConstructor
public class FloorRevisionBump {

    private static final Object SEEN = new Object();

    private final FloorRevisionStore store;
    private final RestaurantHotCache hotCache;

    public void bump(Integer companyId, Integer storeId) {
        if (companyId == null || storeId == null) {
            return;
        }
        if (!mark("bump:" + companyId + ":" + storeId)) {
            return;
        }
        store.increment(companyId, storeId);
        evictAfterCommit(companyId, storeId);
    }

    public void noteRemote(Integer companyId, Integer storeId, Long remoteOrigin) {
        if (companyId == null || storeId == null || remoteOrigin == null || remoteOrigin <= 0) {
            return;
        }
        if (!mark("remote:" + companyId + ":" + storeId)) {
            return;
        }
        int updated = store.advanceSeenOrigin(companyId, storeId, remoteOrigin);
        if (updated > 0) {
            evictAfterCommit(companyId, storeId);
        }
    }

    private boolean mark(String key) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return true;
        }
        return seen().add(key);
    }

    @SuppressWarnings("unchecked")
    private Set<String> seen() {
        Object bound = TransactionSynchronizationManager.getResource(SEEN);
        if (bound instanceof Set<?> existing) {
            return (Set<String>) existing;
        }
        Set<String> created = new HashSet<>();
        TransactionSynchronizationManager.bindResource(SEEN, created);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (TransactionSynchronizationManager.hasResource(SEEN)) {
                    TransactionSynchronizationManager.unbindResource(SEEN);
                }
            }
        });
        return created;
    }

    private void evictAfterCommit(Integer companyId, Integer storeId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            hotCache.evictFloor(companyId, storeId);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                hotCache.evictFloor(companyId, storeId);
            }
        });
    }
}
