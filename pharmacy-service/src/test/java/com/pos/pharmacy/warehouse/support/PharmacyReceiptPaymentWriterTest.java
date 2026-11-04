package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.exception.PharmacyException;
import com.pos.pharmacy.warehouse.dto.PharmacyReceiptPaymentDto;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyReceiptPaymentWriterTest {

    private final PharmacyReceiptPaymentWriter writer = new PharmacyReceiptPaymentWriter();

    @Test
    void singleCashClearsSplit() {
        StockReceipt receipt = StockReceipt.builder()
            .totalCost(new BigDecimal("1000.00"))
            .build();
        writer.applySplit(receipt, List.of(
            new PharmacyReceiptPaymentDto("CASH", new BigDecimal("400")),
            new PharmacyReceiptPaymentDto("TRANSFER", new BigDecimal("200"))
        ));
        writer.applySingle(receipt, "DEBT");
        assertEquals(PharmacyPaymentType.DEBT, receipt.getPaymentType());
        assertTrue(receipt.getPayments().isEmpty());
        assertEquals(0, writer.debtAmount(receipt).compareTo(new BigDecimal("1000.00")));
    }

    @Test
    void splitComputesDebtAndPrimary() {
        StockReceipt receipt = StockReceipt.builder()
            .totalCost(new BigDecimal("10000000"))
            .build();
        writer.applySplit(receipt, List.of(
            new PharmacyReceiptPaymentDto("CASH", new BigDecimal("3000000")),
            new PharmacyReceiptPaymentDto("TRANSFER", new BigDecimal("2000000"))
        ));
        assertEquals(2, receipt.getPayments().size());
        assertEquals(PharmacyPaymentType.CASH, receipt.getPaymentType());
        assertEquals(0, writer.debtAmount(receipt).compareTo(new BigDecimal("5000000.00")));
    }

    @Test
    void splitRejectsOverpay() {
        StockReceipt receipt = StockReceipt.builder()
            .totalCost(new BigDecimal("100"))
            .build();
        assertThrows(PharmacyException.class, () -> writer.applySplit(receipt, List.of(
            new PharmacyReceiptPaymentDto("CARD", new BigDecimal("150"))
        )));
    }
}
