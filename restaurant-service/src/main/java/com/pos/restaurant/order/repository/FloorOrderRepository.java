package com.pos.restaurant.order.repository;

import com.pos.restaurant.order.domain.DeliveryStatus;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FloorOrderRepository extends JpaRepository<FloorOrder, UUID> {

    @Query("select o from FloorOrder o left join fetch o.table left join fetch o.shift where o.id = :id and o.companyId = :companyId")
    Optional<FloorOrder> findByIdAndCompanyId(@Param("id") UUID id, @Param("companyId") Integer companyId);

    boolean existsByTableIdAndStatusIn(Integer tableId, Collection<OrderStatus> statuses);

    @Query("""
        select o from FloorOrder o left join fetch o.table
        where o.companyId = :companyId and o.storeId = :storeId and o.status in :statuses
          and o.table is not null
        """)
    List<FloorOrder> findTableOrdersByCompanyIdAndStoreIdAndStatusIn(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("statuses") Collection<OrderStatus> statuses
    );

    @Query("""
        select o from FloorOrder o left join fetch o.table
        where o.companyId = :companyId and o.storeId = :storeId
          and o.channel = :channel and o.status in :statuses
        order by o.openedAt desc
        """)
    List<FloorOrder> findByCompanyIdAndStoreIdAndChannelAndStatusIn(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("channel") OrderChannel channel,
        @Param("statuses") Collection<OrderStatus> statuses
    );

    @Query("""
        select o from FloorOrder o
        where o.companyId = :companyId and o.storeId = :storeId
          and o.channel = :channel
          and (:status is null or o.status = :status)
          and (:deliveryStatus is null or o.deliveryStatus = :deliveryStatus)
          and (:openedFrom is null or o.openedAt >= :openedFrom)
          and (:openedTo is null or o.openedAt < :openedTo)
          and (
            :q is null or :q = ''
            or lower(coalesce(o.clientName, '')) like lower(concat('%', :q, '%'))
            or lower(coalesce(o.clientPhone, '')) like lower(concat('%', :q, '%'))
            or lower(coalesce(o.deliveryAddress, '')) like lower(concat('%', :q, '%'))
            or cast(o.orderNo as string) like concat('%', :q, '%')
          )
        """)
    Page<FloorOrder> searchByChannel(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("channel") OrderChannel channel,
        @Param("status") OrderStatus status,
        @Param("deliveryStatus") DeliveryStatus deliveryStatus,
        @Param("q") String q,
        @Param("openedFrom") Instant openedFrom,
        @Param("openedTo") Instant openedTo,
        Pageable pageable
    );

    @Query("""
        select o from FloorOrder o
        where o.companyId = :companyId and o.storeId = :storeId
          and o.status in :statuses
        order by o.closedAt desc, o.openedAt desc
        """)
    List<FloorOrder> findRecentByCompanyIdAndStoreIdAndStatusIn(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("statuses") Collection<OrderStatus> statuses,
        Pageable pageable
    );

    @Query("select coalesce(max(o.orderNo), 0) from FloorOrder o where o.storeId = :storeId")
    int findMaxOrderNo(@Param("storeId") Integer storeId);

    long countByShiftIdAndStatusIn(UUID shiftId, Collection<OrderStatus> statuses);
}
