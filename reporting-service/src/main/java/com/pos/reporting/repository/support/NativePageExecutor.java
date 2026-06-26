package com.pos.reporting.repository.support;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Consumer;

@Component
@RequiredArgsConstructor
public class NativePageExecutor {

    private final EntityManager entityManager;

    public Page<Object[]> fetchPage(
        String sql,
        String countSql,
        Consumer<Query> binder,
        Pageable pageable
    ) {
        Query countQuery = entityManager.createNativeQuery(countSql);
        binder.accept(countQuery);
        Number totalNumber = (Number) countQuery.getSingleResult();
        long total = totalNumber != null ? totalNumber.longValue() : 0L;
        if (total == 0L) {
            return new PageImpl<>(List.of(), pageable, 0L);
        }

        Query dataQuery = entityManager.createNativeQuery(sql);
        binder.accept(dataQuery);
        dataQuery.setFirstResult((int) pageable.getOffset());
        dataQuery.setMaxResults(pageable.getPageSize());
        @SuppressWarnings("unchecked")
        List<Object[]> rows = dataQuery.getResultList();
        return new PageImpl<>(rows, pageable, total);
    }
}
