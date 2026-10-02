package com.pos.restaurant.shift.repository;

import com.pos.restaurant.shift.entity.RestaurantCashOp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface RestaurantCashOpRepository extends JpaRepository<RestaurantCashOp, UUID> {

    List<RestaurantCashOp> findByShift_IdOrderByCreatedAtDesc(UUID shiftId);

    @Query("""
        select o.shift.id, o.type, coalesce(sum(o.amount), 0)
        from RestaurantCashOp o
        where o.shift.id in :shiftIds
        group by o.shift.id, o.type
        """)
    List<Object[]> sumByShiftAndType(@Param("shiftIds") Collection<UUID> shiftIds);
}
