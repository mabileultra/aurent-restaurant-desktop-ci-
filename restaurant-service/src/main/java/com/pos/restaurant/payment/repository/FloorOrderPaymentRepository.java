package com.pos.restaurant.payment.repository;

import com.pos.restaurant.payment.entity.FloorOrderPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FloorOrderPaymentRepository extends JpaRepository<FloorOrderPayment, UUID> {
}
