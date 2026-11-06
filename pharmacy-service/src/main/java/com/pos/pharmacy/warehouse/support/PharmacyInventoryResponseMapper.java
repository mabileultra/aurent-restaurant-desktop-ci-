package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.warehouse.dto.PharmacyInventoryLineResponse;
import com.pos.pharmacy.warehouse.dto.PharmacyInventoryResponse;
import com.pos.pharmacy.warehouse.entity.StockInventory;
import com.pos.pharmacy.warehouse.entity.StockInventoryLine;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PharmacyInventoryResponseMapper {

    public PharmacyInventoryResponse toResponse(StockInventory inventory) {
        List<PharmacyInventoryLineResponse> lines = inventory.getLines() == null
            ? List.of()
            : inventory.getLines().stream().map(this::toLine).toList();
        return new PharmacyInventoryResponse(
            inventory.getId(),
            inventory.getInventoryNumber(),
            inventory.getStoreId(),
            inventory.getNotes(),
            inventory.getTotalLines(),
            inventory.getTotalDifference(),
            inventory.getCreatedAt(),
            inventory.getCreatedBy(),
            lines
        );
    }

    public PharmacyInventoryResponse toSummary(StockInventory inventory) {
        return new PharmacyInventoryResponse(
            inventory.getId(),
            inventory.getInventoryNumber(),
            inventory.getStoreId(),
            inventory.getNotes(),
            inventory.getTotalLines(),
            inventory.getTotalDifference(),
            inventory.getCreatedAt(),
            inventory.getCreatedBy(),
            List.of()
        );
    }

    private PharmacyInventoryLineResponse toLine(StockInventoryLine line) {
        return new PharmacyInventoryLineResponse(
            line.getId(),
            line.getProductId(),
            line.getProductName(),
            line.getProductSku(),
            line.getSystemQuantity(),
            line.getCountedQuantity(),
            line.getDifference()
        );
    }
}
