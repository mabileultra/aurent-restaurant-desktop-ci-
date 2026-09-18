package com.pos.pharmacy.marks.repository;

import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StockMarkRepository extends JpaRepository<StockMark, UUID> {

    List<StockMark> findByCompanyIdAndMarkKeyIn(Integer companyId, Collection<String> markKeys);

    Optional<StockMark> findFirstByCompanyIdAndMarkKeyInAndStatus(
        Integer companyId,
        Collection<String> markKeys,
        StockMarkStatus status
    );

    boolean existsByCompanyIdAndMarkKeyInAndStatusIn(
        Integer companyId,
        Collection<String> markKeys,
        Collection<StockMarkStatus> statuses
    );

    List<StockMark> findTop100ByStatusOrderByUpdatedAtAsc(StockMarkStatus status);
}
