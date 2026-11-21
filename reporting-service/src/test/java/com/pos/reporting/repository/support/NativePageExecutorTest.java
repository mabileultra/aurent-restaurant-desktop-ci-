package com.pos.reporting.repository.support;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NativePageExecutorTest {

    @Mock
    EntityManager entityManager;
    @Mock
    Query countQuery;
    @Mock
    Query dataQuery;

    @InjectMocks
    NativePageExecutor nativePageExecutor;

    @Test
    void fetchPageAppliesOffsetAndLimitFromPageable() {
        when(entityManager.createNativeQuery("count-sql")).thenReturn(countQuery);
        when(entityManager.createNativeQuery("data-sql")).thenReturn(dataQuery);
        when(countQuery.getSingleResult()).thenReturn(45L);
        when(dataQuery.getResultList()).thenReturn(List.of(new Object[]{"a"}, new Object[]{"b"}));

        PageRequest pageable = PageRequest.of(2, 10);
        Page<Object[]> page = nativePageExecutor.fetchPage(
            "data-sql",
            "count-sql",
            query -> {},
            pageable
        );

        ArgumentCaptor<Integer> first = ArgumentCaptor.forClass(Integer.class);
        ArgumentCaptor<Integer> max = ArgumentCaptor.forClass(Integer.class);
        verify(dataQuery).setFirstResult(first.capture());
        verify(dataQuery).setMaxResults(max.capture());
        assertEquals(20, first.getValue());
        assertEquals(10, max.getValue());
        assertEquals(45L, page.getTotalElements());
        assertEquals(2, page.getNumber());
        assertEquals(2, page.getContent().size());
    }
}
