package com.pos.scales.codec;

import com.pos.catalog.service.product.support.ProductPluValidator;
import com.pos.exception.PosExceptions;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

/**
 * Весовой EAN-13: 20 + PLU(5) + вес в граммах(5) + check digit.
 * Префикс 20–29 — переменный вес; модель весов не важна.
 */
@Component
@RequiredArgsConstructor
public class WeightBarcodeCodec {

    public static final String WEIGHT_PREFIX = "20";
    private static final int EAN13_LENGTH = 13;
    private static final int MAX_GRAMS = 99_999;

    private final ProductPluValidator pluValidator;

    public String encode(String plu, BigDecimal weightKg) {
        if (weightKg == null || weightKg.compareTo(BigDecimal.ZERO) <= 0) {
            throw PosExceptions.badRequest("Weight must be positive", "weightKg", weightKg);
        }
        String pluPart = pluValidator.toBarcodePart(plu);
        int grams = weightKg
            .multiply(BigDecimal.valueOf(1000))
            .setScale(0, RoundingMode.HALF_UP)
            .intValueExact();
        if (grams < 1 || grams > MAX_GRAMS) {
            throw PosExceptions.badRequest("Weight out of range for label barcode", "weightKg", weightKg);
        }
        String body = WEIGHT_PREFIX + pluPart + String.format("%05d", grams);
        return body + ean13CheckDigit(body);
    }

    public Optional<DecodedWeightBarcode> tryDecode(String raw) {
        if (!StringUtils.hasText(raw)) {
            return Optional.empty();
        }
        String digits = raw.trim().replaceAll("\\D", "");
        if (digits.length() != EAN13_LENGTH || !digits.startsWith("2")) {
            return Optional.empty();
        }
        String body = digits.substring(0, 12);
        char expected = ean13CheckDigit(body);
        if (digits.charAt(12) != expected) {
            return Optional.empty();
        }
        // 20PPPPPWWWWW C  или  2XPPPPPWWWWW C — PLU в позициях 2..6 (0-based: 2-6)
        String pluRaw = digits.substring(2, 7);
        String plu = pluValidator.normalizeOrNull(pluRaw);
        // PLU «0» — не весовая этикетка (часто обычный штучный штрихкод с префиксом 20)
        if (plu == null || "0".equals(plu)) {
            return Optional.empty();
        }
        int grams = Integer.parseInt(digits.substring(7, 12));
        if (grams < 1) {
            return Optional.empty();
        }
        BigDecimal weightKg = BigDecimal.valueOf(grams)
            .divide(BigDecimal.valueOf(1000), 3, RoundingMode.HALF_UP);
        return Optional.of(new DecodedWeightBarcode(plu, weightKg, digits));
    }

    public DecodedWeightBarcode requireDecode(String raw) {
        return tryDecode(raw)
            .orElseThrow(() -> PosExceptions.badRequest("Not a weight barcode", "barcode", raw));
    }

    static char ean13CheckDigit(String twelveDigits) {
        int sum = 0;
        for (int i = 0; i < 12; i++) {
            int d = twelveDigits.charAt(i) - '0';
            sum += (i % 2 == 0) ? d : d * 3;
        }
        int check = (10 - (sum % 10)) % 10;
        return (char) ('0' + check);
    }

    public record DecodedWeightBarcode(String plu, BigDecimal weightKg, String barcode) {}
}
