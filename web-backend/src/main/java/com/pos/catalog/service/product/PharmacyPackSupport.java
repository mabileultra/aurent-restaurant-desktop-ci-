package com.pos.catalog.service.product;

import com.pos.domain.ProductQuantityRules;
import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import com.pos.catalog.entity.Product;
import com.pos.util.QuantityUtil;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.OptionalInt;

/**
 * Продажа поштучно из упаковки: остаток на складе в упаковках, в чеке — дробное списание.
 */
public final class PharmacyPackSupport {

    public static final String ATTR_UNITS_IN_PACK = "units_in_pack";
    private static final BigDecimal PRICE_TOLERANCE = new BigDecimal("0.03"); // 3%

    private PharmacyPackSupport() {
    }

    public static OptionalInt unitsInPack(Map<String, String> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            return OptionalInt.empty();
        }
        String raw = attributes.get(ATTR_UNITS_IN_PACK);
        if (raw == null || raw.isBlank()) {
            raw = attributes.get("unitsInPack");
        }
        if (raw == null || raw.isBlank()) {
            raw = attributes.get("pack_size");
        }
        if (raw == null || raw.isBlank()) {
            raw = attributes.get("packSize");
        }
        if (raw == null || raw.isBlank()) {
            return OptionalInt.empty();
        }
        try {
            String normalized = raw.trim().replace(',', '.');
            double value = Double.parseDouble(normalized);
            int units = (int) Math.round(value);
            if (units <= 1) {
                return OptionalInt.empty();
            }
            return OptionalInt.of(units);
        } catch (NumberFormatException ignored) {
            return OptionalInt.empty();
        }
    }

    public static ProductQuantityRules checkoutQuantityRules(Product product, Map<String, String> attributes) {
        if (unitsInPack(attributes).isPresent()) {
            SaleType saleType = product.getSaleType() != null ? product.getSaleType() : SaleType.PIECE;
            UnitCode unitCode = product.getUnitCode() != null ? product.getUnitCode() : UnitCode.PCS;
            return new ProductQuantityRules(saleType, unitCode, QuantityUtil.SCALE, true);
        }
        return ProductQuantityRules.from(product);
    }

    /**
     * Себестоимость строки продажи.
     * <ul>
     *   <li>Количество в упаковках (дробь) → {@code costPrice × qty}</li>
     *   <li>Количество в штуках при цене за штуку → {@code costPrice / unitsInPack × qty}</li>
     * </ul>
     */
    public static BigDecimal costEstimate(
        Product product,
        BigDecimal unitPrice,
        BigDecimal netQty,
        Map<String, String> attributes
    ) {
        if (product == null || product.getCostPrice() == null || netQty == null || netQty.signum() <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal costPrice = product.getCostPrice();
        OptionalInt unitsOpt = unitsInPack(attributes);
        if (unitsOpt.isEmpty()) {
            unitsOpt = inferUnitsInPack(unitPrice, product.getSellingPrice());
        }
        if (unitsOpt.isPresent() && isPieceEncodedLine(unitPrice, product.getSellingPrice(), unitsOpt.getAsInt(), netQty)) {
            return costPrice
                .multiply(netQty)
                .divide(BigDecimal.valueOf(unitsOpt.getAsInt()), 2, RoundingMode.HALF_UP);
        }
        return costPrice.multiply(netQty).setScale(2, RoundingMode.HALF_UP);
    }

    /** Если в атрибутах нет фасовки — выводим шт/уп из цены штуки vs цены упаковки. */
    public static OptionalInt inferUnitsInPack(BigDecimal unitPrice, BigDecimal packSellingPrice) {
        if (unitPrice == null || packSellingPrice == null) {
            return OptionalInt.empty();
        }
        if (unitPrice.signum() <= 0 || packSellingPrice.signum() <= 0) {
            return OptionalInt.empty();
        }
        if (unitPrice.compareTo(packSellingPrice) >= 0) {
            return OptionalInt.empty();
        }
        BigDecimal ratio = packSellingPrice.divide(unitPrice, 4, RoundingMode.HALF_UP);
        int units = ratio.setScale(0, RoundingMode.HALF_UP).intValue();
        if (units <= 1 || units > 500) {
            return OptionalInt.empty();
        }
        if (!pricesNear(unitPrice.multiply(BigDecimal.valueOf(units)), packSellingPrice)) {
            return OptionalInt.empty();
        }
        return OptionalInt.of(units);
    }

    /** Количество для отчётов: штуки (не доля упаковки). */
    public static long reportableUnits(
        Product product,
        BigDecimal unitPrice,
        BigDecimal quantity,
        Map<String, String> attributes
    ) {
        if (quantity == null || quantity.signum() <= 0) {
            return 0L;
        }
        OptionalInt unitsOpt = unitsInPack(attributes);
        if (unitsOpt.isEmpty()) {
            unitsOpt = inferUnitsInPack(unitPrice, product != null ? product.getSellingPrice() : null);
        }
        if (unitsOpt.isEmpty()) {
            return quantity.setScale(0, RoundingMode.HALF_UP).longValue();
        }
        int units = unitsOpt.getAsInt();
        if (isPieceEncodedLine(unitPrice, product != null ? product.getSellingPrice() : null, units, quantity)) {
            return quantity.setScale(0, RoundingMode.HALF_UP).longValue();
        }
        return quantity
            .multiply(BigDecimal.valueOf(units))
            .setScale(0, RoundingMode.HALF_UP)
            .max(BigDecimal.ZERO)
            .longValue();
    }

    /**
     * Строка закодирована как штуки: целое qty и цена ≈ цена_упаковки / шт_в_упаковке.
     */
    public static boolean isPieceEncodedLine(
        BigDecimal unitPrice,
        BigDecimal packSellingPrice,
        int unitsInPack,
        BigDecimal quantity
    ) {
        if (unitsInPack <= 1 || unitPrice == null || packSellingPrice == null) {
            return false;
        }
        if (unitPrice.signum() <= 0 || packSellingPrice.signum() <= 0 || quantity == null) {
            return false;
        }
        if (quantity.remainder(BigDecimal.ONE).abs().compareTo(new BigDecimal("0.0005")) > 0) {
            return false;
        }
        BigDecimal expectedPiece = packSellingPrice.divide(
            BigDecimal.valueOf(unitsInPack),
            4,
            RoundingMode.HALF_UP
        );
        return pricesNear(unitPrice, expectedPiece)
            || pricesNear(unitPrice.multiply(BigDecimal.valueOf(unitsInPack)), packSellingPrice);
    }

    private static boolean pricesNear(BigDecimal a, BigDecimal b) {
        if (a == null || b == null || b.signum() <= 0) {
            return false;
        }
        BigDecimal diff = a.subtract(b).abs();
        BigDecimal limit = b.multiply(PRICE_TOLERANCE).max(new BigDecimal("1.00"));
        return diff.compareTo(limit) <= 0;
    }
}
