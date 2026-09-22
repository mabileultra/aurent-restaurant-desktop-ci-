package com.pos.restaurant.payment.repository;

import com.pos.restaurant.payment.entity.FloorOrderPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FloorOrderPaymentRepository extends JpaRepository<FloorOrderPayment, UUID> {

    Optional<FloorOrderPayment> findFirstByOrder_IdOrderByPaidAtDesc(UUID orderId);

    @Query("""
        select p from FloorOrderPayment p
        join fetch p.order o
        where o.id in :orderIds
        """)
    List<FloorOrderPayment> findByOrder_IdIn(@Param("orderIds") Collection<UUID> orderIds);
}
