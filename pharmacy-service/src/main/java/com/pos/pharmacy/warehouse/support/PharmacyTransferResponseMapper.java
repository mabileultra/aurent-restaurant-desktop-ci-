package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.warehouse.dto.PharmacyTransferLineResponse;
import com.pos.pharmacy.warehouse.dto.PharmacyTransferResponse;
import com.pos.pharmacy.warehouse.entity.StockTransfer;
import com.pos.pharmacy.warehouse.entity.StockTransferLine;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PharmacyTransferResponseMapper {

    public PharmacyTransferResponse toResponse(StockTransfer transfer) {
        List<PharmacyTransferLineResponse> lines = transfer.getLines() == null
            ? List.of()
            : transfer.getLines().stream().map(this::toLine).toList();
        return new PharmacyTransferResponse(
            transfer.getId(),
            transfer.getTransferNumber(),
            transfer.getFromStoreId(),
            transfer.getToStoreId(),
            transfer.getFromStoreName(),
            transfer.getToStoreName(),
            transfer.getSourceReceiptId(),
            transfer.getSourceReceiptNumber(),
            transfer.getNotes(),
            transfer.getTotalQuantity(),
            transfer.getCreatedAt(),
            lines
        );
    }

    public PharmacyTransferResponse toSummary(StockTransfer transfer) {
        return new PharmacyTransferResponse(
            transfer.getId(),
            transfer.getTransferNumber(),
            transfer.getFromStoreId(),
            transfer.getToStoreId(),
            transfer.getFromStoreName(),
            transfer.getToStoreName(),
            transfer.getSourceReceiptId(),
            transfer.getSourceReceiptNumber(),
            transfer.getNotes(),
            transfer.getTotalQuantity(),
            transfer.getCreatedAt(),
            List.of()
        );
    }

    private PharmacyTransferLineResponse toLine(StockTransferLine line) {
        return new PharmacyTransferLineResponse(
            line.getId(),
            line.getProductId(),
            line.getProductName(),
            line.getProductSku(),
            line.getQuantity()
        );
    }
}
