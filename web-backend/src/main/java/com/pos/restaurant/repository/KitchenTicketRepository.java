package com.pos.restaurant.repository;

import com.pos.restaurant.domain.KitchenTicketStatus;
import com.pos.restaurant.entity.KitchenTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KitchenTicketRepository extends JpaRepository<KitchenTicket, UUID> {

    boolean existsBySessionLineId(UUID sessionLineId);

    Optional<KitchenTicket> findBySessionLineId(UUID sessionLineId);

    List<KitchenTicket> findByStoreIdAndStatusInOrderByCreatedAtAsc(
        Integer storeId,
        Collection<KitchenTicketStatus> statuses
    );

    List<KitchenTicket> findByStoreIdAndKitchenDepartmentIgnoreCaseAndStatusInOrderByCreatedAtAsc(
        Integer storeId,
        String kitchenDepartment,
        Collection<KitchenTicketStatus> statuses
    );
}
