package com.pos.pharmacy.warehouse.repository;

import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StockReceiptLineRepository extends JpaRepository<StockReceiptLine, UUID> {
}
