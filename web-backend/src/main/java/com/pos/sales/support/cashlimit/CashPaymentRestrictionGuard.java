package com.pos.sales.support.cashlimit;

import com.pos.catalog.entity.Product;
import com.pos.exception.PosExceptions;
import com.pos.operator.OperatorBrvService;
import com.pos.operator.OperatorBrvServiceImpl;
import com.pos.sales.entity.Sale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Year;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Серверная проверка наличной оплаты (AUR-13): категории + порог по БРВ.
 */
@Component
@RequiredArgsConstructor
public class CashPaymentRestrictionGuard {

    private final OperatorBrvService operatorBrvService;
    private final Clock clock = Clock.system(OperatorBrvServiceImpl.OPERATOR_ZONE);

    /**
     * @param paymentMethod способ оплаты чека
     * @param cashAmount    наличная доля (CASH / MIXED)
     * @param products      товары в чеке
     * @param attributesByProductId атрибуты продуктов
     */
    public void assertCashAllowed(
        Sale.PaymentMethod paymentMethod,
        BigDecimal cashAmount,
        List<Product> products,
        Map<UUID, Map<String, String>> attributesByProductId
    ) {
        if (cashAmount == null || cashAmount.signum() <= 0) {
            return;
        }
        if (paymentMethod != Sale.PaymentMethod.CASH && paymentMethod != Sale.PaymentMethod.MIXED) {
            return;
        }

        boolean allAgricultural = true;
        for (Product product : products) {
            Map<String, String> attrs = attributesByProductId.getOrDefault(product.getId(), Map.of());
            CashRestrictionCategory category = resolveCategory(attrs);
            if (!category.isAgriculturalException() && !isAgriculturalFlag(attrs)) {
                allAgricultural = false;
            }
            assertCategoryAllowsCash(product, category, attrs);
        }

        if (allAgricultural && !products.isEmpty()) {
            return;
        }

        BigDecimal limit = operatorBrvService.cashPaymentLimitSoum();
        if (cashAmount.compareTo(limit) > 0) {
            Map<String, Object> ctx = new LinkedHashMap<>();
            ctx.put("reasonCode", CashPaymentRestrictionCodes.AMOUNT_LIMIT);
            ctx.put("cashAmount", cashAmount.toPlainString());
            ctx.put("cashPaymentLimitSoum", limit.toPlainString());
            throw PosExceptions.badRequest(
                "Наличная оплата превышает допустимый порог "
                    + limit.toPlainString()
                    + " сум (расчёт по актуальной БРВ).",
                ctx
            );
        }
    }

    private void assertCategoryAllowsCash(
        Product product,
        CashRestrictionCategory category,
        Map<String, String> attrs
    ) {
        if (category.isAgriculturalException() || isAgriculturalFlag(attrs)) {
            return;
        }
        if (category.isAbsoluteCashBan()) {
            rejectCategory(product, category, CashPaymentRestrictionCodes.CATEGORY_FORBIDDEN);
        }
        if (category.isVehicleAgeGated()) {
            Integer year = parseYear(attrs.get(CashRestrictionCategory.VEHICLE_YEAR_ATTR_KEY));
            int currentYear = Year.now(clock).getValue();
            if (year == null) {
                rejectCategory(product, category, CashPaymentRestrictionCodes.VEHICLE_AGE_FORBIDDEN);
            }
            int age = currentYear - year;
            if (age < CashRestrictionCategory.VEHICLE_CASH_BAN_MAX_AGE_YEARS) {
                Map<String, Object> ctx = new LinkedHashMap<>();
                ctx.put("reasonCode", CashPaymentRestrictionCodes.VEHICLE_AGE_FORBIDDEN);
                ctx.put("category", category.name());
                ctx.put("productId", String.valueOf(product.getId()));
                ctx.put("vehicleManufactureYear", year);
                ctx.put("vehicleAgeYears", age);
                throw PosExceptions.badRequest(
                    "Наличная оплата запрещена для транспортных средств категорий M/N/O/G "
                        + "возрастом менее "
                        + CashRestrictionCategory.VEHICLE_CASH_BAN_MAX_AGE_YEARS
                        + " лет (товар: "
                        + productLabel(product)
                        + ").",
                    ctx
                );
            }
        }
    }

    private void rejectCategory(Product product, CashRestrictionCategory category, String reasonCode) {
        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put("reasonCode", reasonCode);
        ctx.put("category", category.name());
        ctx.put("productId", String.valueOf(product.getId()));
        throw PosExceptions.badRequest(
            "Наличная оплата запрещена для категории «"
                + categoryLabelRu(category)
                + "» (товар: "
                + productLabel(product)
                + ").",
            ctx
        );
    }

    static CashRestrictionCategory resolveCategory(Map<String, String> attrs) {
        return CashRestrictionCategory.fromAttribute(
            attrs.get(CashRestrictionCategory.ATTR_KEY)
        );
    }

    static boolean isAgriculturalFlag(Map<String, String> attrs) {
        String raw = attrs.get(CashRestrictionCategory.AGRICULTURAL_ATTR_KEY);
        if (raw == null) {
            return false;
        }
        String v = raw.trim().toLowerCase();
        return v.equals("1") || v.equals("true") || v.equals("yes") || v.equals("да");
    }

    static Integer parseYear(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static String productLabel(Product product) {
        String name = product.getName();
        return name != null && !name.isBlank() ? name : String.valueOf(product.getId());
    }

    private static String categoryLabelRu(CashRestrictionCategory category) {
        return switch (category) {
            case ELECTRICITY -> "электроэнергия";
            case NATURAL_GAS -> "природный газ";
            case WATER_SUPPLY -> "водоснабжение";
            case GOVERNMENT_SERVICES -> "государственные услуги";
            case ALCOHOL -> "алкогольная продукция";
            case TOBACCO -> "табачная продукция";
            case FUEL -> "топливо";
            case EV_CHARGING -> "зарядка электромобилей";
            case REAL_ESTATE -> "недвижимость";
            case VEHICLE_MNOG -> "транспортные средства M/N/O/G";
            case AGRICULTURAL -> "сельхозпродукция";
            case NONE -> "общая";
        };
    }
}
