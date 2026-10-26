package com.pos.restaurant.floor.revision;

import com.pos.restaurant.config.RestaurantHotCache;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FloorRevisionBumpTest {

    @Mock
    private FloorRevisionStore store;

    @Mock
    private RestaurantHotCache hotCache;

    @InjectMocks
    private FloorRevisionBump bump;

    @AfterEach
    void clearSync() {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        for (TransactionSynchronization sync : synchronizations()) {
            sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        }
        TransactionSynchronizationManager.clearSynchronization();
    }

    @Test
    void oneBusinessOperationIncrementsOnce() {
        TransactionSynchronizationManager.initSynchronization();
        bump.bump(4, 9);
        bump.bump(4, 9);
        verify(store, times(1)).increment(4, 9);
    }

    @Test
    void rollbackDoesNotEvict() {
        TransactionSynchronizationManager.initSynchronization();
        bump.bump(4, 9);
        for (TransactionSynchronization sync : synchronizations()) {
            sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        }
        verify(hotCache, never()).evictFloor(4, 9);
    }

    @Test
    void commitEvictsAfterTheRowIsVisible() {
        TransactionSynchronizationManager.initSynchronization();
        bump.bump(4, 9);
        for (TransactionSynchronization sync : synchronizations()) {
            sync.afterCommit();
        }
        verify(hotCache).evictFloor(4, 9);
    }

    @Test
    void sameRemoteOriginDoesNotEvict() {
        TransactionSynchronizationManager.initSynchronization();
        when(store.advanceSeenOrigin(4, 9, 3L)).thenReturn(0);
        bump.noteRemote(4, 9, 3L);
        for (TransactionSynchronization sync : synchronizations()) {
            sync.afterCommit();
        }
        verify(hotCache, never()).evictFloor(4, 9);
    }

    @Test
    void newerRemoteOriginEvictsOnce() {
        TransactionSynchronizationManager.initSynchronization();
        when(store.advanceSeenOrigin(4, 9, 3L)).thenReturn(1);
        bump.noteRemote(4, 9, 3L);
        bump.noteRemote(4, 9, 3L);
        verify(store, times(1)).advanceSeenOrigin(4, 9, 3L);
        for (TransactionSynchronization sync : synchronizations()) {
            sync.afterCommit();
        }
        verify(hotCache).evictFloor(4, 9);
    }

    @Test
    void missingCompanyDoesNotWrite() {
        bump.bump(null, 9);
        bump.noteRemote(4, 9, 0L);
        verifyNoInteractions(store);
    }

    private static List<TransactionSynchronization> synchronizations() {
        return List.copyOf(TransactionSynchronizationManager.getSynchronizations());
    }
}
