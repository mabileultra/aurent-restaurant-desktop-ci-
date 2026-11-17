package com.pos.integrations.fiscal.support;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.RETURNS_SELF;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FiscalModuleLockTest {

    @Test
    void locksDistinctKeysInSortedOrderToAvoidDeadlocks() {
        EntityManager entityManager = mock(EntityManager.class);
        Query query = mock(Query.class, RETURNS_SELF);
        when(query.getSingleResult()).thenReturn(1);
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);

        new FiscalModuleLock(entityManager).lockAll(List.of("b:2", "a:1", "b:2", "a:0"));

        ArgumentCaptor<Object> keys = ArgumentCaptor.forClass(Object.class);
        verify(query, times(3)).setParameter(eq("key"), keys.capture());
        verify(query, times(3)).setParameter("ns", FiscalModuleLock.LOCK_NAMESPACE);
        verify(query, times(3)).getSingleResult();
        verify(entityManager, times(3))
            .createNativeQuery("SELECT 1 FROM pg_advisory_xact_lock(:ns, hashtext(:key))");
        assertThat(keys.getAllValues()).containsExactly("a:0", "a:1", "b:2");
    }
}
