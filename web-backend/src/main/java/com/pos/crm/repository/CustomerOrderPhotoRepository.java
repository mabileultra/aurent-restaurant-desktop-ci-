package com.pos.crm.repository;

import com.pos.crm.entity.CustomerOrderPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerOrderPhotoRepository extends JpaRepository<CustomerOrderPhoto, Long> {

    Optional<CustomerOrderPhoto> findByCustomerOrder_IdAndSlot(long orderId, int slot);
}
