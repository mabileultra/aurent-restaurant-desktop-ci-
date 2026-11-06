package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyReceiptErrors;
import com.pos.pharmacy.warehouse.dto.PharmacyReceiptPaymentDto;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptPayment;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Платежи поставщику по приходу: строки CASH/CARD/TRANSFER, долг = остаток от totalCost.
 */
@Component
public class PharmacyReceiptPaymentWriter {

    public void applySingle(StockReceipt receipt, String paymentType) {
        clearPayments(receipt);
        receipt.setPaymentType(PharmacyPaymentType.normalize(paymentType));
    }

    public void applySplit(StockReceipt receipt, List<PharmacyReceiptPaymentDto> payments) {
        List<PharmacyReceiptPaymentDto> cleaned = sanitize(payments);
        clearPayments(receipt);
        if (cleaned.isEmpty()) {
            receipt.setPaymentType(PharmacyPaymentType.DEBT);
            return;
        }
        BigDecimal total = nz(receipt.getTotalCost());
        BigDecimal paid = BigDecimal.ZERO;
        int order = 0;
        for (PharmacyReceiptPaymentDto row : cleaned) {
            paid = paid.add(row.amount());
            receipt.getPayments().add(StockReceiptPayment.builder()
                .receipt(receipt)
                .method(row.method())
                .amount(row.amount())
                .sortOrder(order++)
                .build());
        }
        if (total.signum() > 0 && paid.compareTo(total) > 0) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_PAYMENT_EXCEEDS);
        }
        receipt.setPaymentType(deriveHeaderType(cleaned, debtAmount(total, paid)));
    }

    public BigDecimal debtAmount(StockReceipt receipt) {
        BigDecimal total = nz(receipt.getTotalCost());
        if (total.signum() <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal paid = receipt.getPayments().stream()
            .map(StockReceiptPayment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (receipt.getPayments().isEmpty()) {
            return PharmacyPaymentType.DEBT.equals(receipt.getPaymentType()) ? total : BigDecimal.ZERO;
        }
        return debtAmount(total, paid);
    }

    public List<PharmacyReceiptPaymentDto> toDtos(StockReceipt receipt) {
        return receipt.getPayments().stream()
            .sorted(Comparator.comparingInt(StockReceiptPayment::getSortOrder))
            .map(p -> new PharmacyReceiptPaymentDto(p.getMethod(), scale(p.getAmount())))
            .toList();
    }

    private static List<PharmacyReceiptPaymentDto> sanitize(List<PharmacyReceiptPaymentDto> payments) {
        if (payments == null || payments.isEmpty()) {
            return List.of();
        }
        Map<String, BigDecimal> byMethod = new LinkedHashMap<>();
        for (PharmacyReceiptPaymentDto row : payments) {
            if (row == null) {
                continue;
            }
            String method = PharmacyPaymentType.normalizePaidMethod(row.method());
            BigDecimal amount = row.amount();
            if (amount == null || amount.signum() <= 0) {
                continue;
            }
            if (amount.signum() < 0) {
                throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_AMOUNT_NEGATIVE);
            }
            byMethod.merge(method, scale(amount), BigDecimal::add);
        }
        List<PharmacyReceiptPaymentDto> out = new ArrayList<>();
        byMethod.forEach((method, amount) -> out.add(new PharmacyReceiptPaymentDto(method, amount)));
        return out;
    }

    private static String deriveHeaderType(List<PharmacyReceiptPaymentDto> paid, BigDecimal debt) {
        if (paid.isEmpty()) {
            return PharmacyPaymentType.DEBT;
        }
        PharmacyReceiptPaymentDto top = paid.stream()
            .max(Comparator.comparing(PharmacyReceiptPaymentDto::amount))
            .orElse(paid.get(0));
        if (paid.size() == 1 && debt.signum() <= 0) {
            return top.method();
        }
        return top.method();
    }

    private static BigDecimal debtAmount(BigDecimal total, BigDecimal paid) {
        BigDecimal debt = total.subtract(paid);
        return debt.signum() > 0 ? scale(debt) : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    private static void clearPayments(StockReceipt receipt) {
        receipt.getPayments().clear();
    }

    private static BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private static BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
