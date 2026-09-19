package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.exception.BusinessException;
import com.pos.pharmacy.marks.service.PharmacyStockMarkService;
import com.pos.pharmacy.warehouse.dto.PharmacyReceiptActivateRequest;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PharmacyReceiptMarkRegistrationTest {

    private final PharmacyReceiptMarkRegistration registration =
        new PharmacyReceiptMarkRegistration(new NoopStockMarkService());

    @Test
    void unmarkedReceiptDoesNotRequireMarks() {
        StockReceipt receipt = receiptWith(product(false), BigDecimal.TEN);
        assertDoesNotThrow(() -> registration.validateMarkedProducts(receipt, List.of()));
    }

    @Test
    void markedReceiptAllowsEmptyAndPartialMarks() {
        Product product = product(true);
        StockReceipt receipt = receiptWith(product, BigDecimal.valueOf(2));
        assertDoesNotThrow(() -> registration.validateMarkedProducts(receipt, List.of()));
        assertDoesNotThrow(() -> registration.validateMarkedProducts(
            receipt,
            List.of(new PharmacyReceiptActivateRequest.PharmacyReceiptMarkItem(
                product.getId(), null, "010478001234567821AAAA91X", "OK"
            ))
        ));
    }

    @Test
    void duplicateMarkCodesAreRejected() {
        Product product = product(true);
        StockReceipt receipt = receiptWith(product, BigDecimal.valueOf(2));
        PharmacyReceiptActivateRequest.PharmacyReceiptMarkItem same =
            new PharmacyReceiptActivateRequest.PharmacyReceiptMarkItem(
                product.getId(), null, "010478001234567821AAAA91X", "OK"
            );
        assertThrows(BusinessException.class, () -> registration.validateMarkedProducts(
            receipt,
            List.of(same, same)
        ));
    }

    private static Product product(boolean marked) {
        Product product = new Product();
        product.setId(UUID.randomUUID());
        product.setName("Test");
        product.setMarkedProduct(marked);
        return product;
    }

    private static StockReceipt receiptWith(Product product, BigDecimal qty) {
        StockReceiptLine line = StockReceiptLine.builder()
            .id(UUID.randomUUID())
            .product(product)
            .quantity(qty)
            .build();
        StockReceipt receipt = StockReceipt.builder()
            .id(UUID.randomUUID())
            .storeId(1)
            .build();
        receipt.setLines(List.of(line));
        return receipt;
    }

    /** Заглушка — validateMarkedProducts репозиторий не трогает. */
    private static final class NoopStockMarkService implements PharmacyStockMarkService {
        @Override
        public com.pos.pharmacy.marks.dto.StockMarkCheckResponse findInStock(Integer storeId, String code) {
            return com.pos.pharmacy.marks.dto.StockMarkCheckResponse.missing();
        }

        @Override
        public com.pos.pharmacy.marks.dto.StockMarkRegisterResponse registerInStock(
            com.pos.pharmacy.marks.dto.StockMarkRegisterRequest request
        ) {
            return new com.pos.pharmacy.marks.dto.StockMarkRegisterResponse(0, List.of());
        }

        @Override
        public int markPendingWithdraw(
            Integer storeId,
            java.util.UUID saleId,
            java.util.Collection<String> markCodes
        ) {
            return 0;
        }

        @Override
        public int confirmSold(
            Integer companyId,
            Integer storeId,
            java.util.Collection<String> markCodes,
            String aslStatus
        ) {
            return 0;
        }

        @Override
        public void recordWithdrawAttempt(
            Integer companyId,
            Integer storeId,
            java.util.Collection<String> markCodes,
            String error
        ) {
        }

        @Override
        public java.util.List<com.pos.pharmacy.marks.entity.StockMark> findPendingWithdrawBatch(int limit) {
            return java.util.List.of();
        }

        @Override
        public int restoreOnReturn(
            Integer storeId,
            java.util.UUID saleId,
            java.util.Collection<String> markCodes
        ) {
            return 0;
        }
    }
}
