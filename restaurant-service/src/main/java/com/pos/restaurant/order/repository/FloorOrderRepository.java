package com.pos.restaurant.order.repository;

import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FloorOrderRepository extends JpaRepository<FloorOrder, UUID> {

    @Query("select o from FloorOrder o join fetch o.table left join fetch o.shift where o.id = :id and o.companyId = :companyId")
    Optional<FloorOrder> findByIdAndCompanyId(@Param("id") UUID id, @Param("companyId") Integer companyId);

    boolean existsByTableIdAndStatusIn(Integer tableId, Collection<OrderStatus> statuses);

    @Query("""
        select o from FloorOrder o join fetch o.table
        where o.companyId = :companyId and o.storeId = :storeId and o.status in :statuses
        """)
    List<FloorOrder> findByCompanyIdAndStoreIdAndStatusIn(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("statuses") Collection<OrderStatus> statuses
    );

    @Query("select coalesce(max(o.orderNo), 0) from FloorOrder o where o.storeId = :storeId")
    int findMaxOrderNo(@Param("storeId") Integer storeId);

    long countByShiftIdAndStatusIn(UUID shiftId, Collection<OrderStatus> statuses);
}
