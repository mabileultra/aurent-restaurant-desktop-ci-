package com.pos.sales.support.cashlimit;

import java.util.Locale;

/**
 * Категории товаров/услуг с ограничением наличной оплаты (AUR-13).
 * Значение хранится в product_attributes.field_key = {@link #ATTR_KEY}.
 */
public enum CashRestrictionCategory {
    /** Без спец. ограничения (только общий порог по сумме). */
    NONE,
    ELECTRICITY,
    NATURAL_GAS,
    WATER_SUPPLY,
    GOVERNMENT_SERVICES,
    ALCOHOL,
    TOBACCO,
    FUEL,
    EV_CHARGING,
    REAL_ESTATE,
    /** ТС категорий M/N/O/G — наличка запрещена, если возраст &lt; 10 лет. */
    VEHICLE_MNOG,
    /** Сельхозпродукция — наличка разрешена (исключение). */
    AGRICULTURAL;

    public static final String ATTR_KEY = "cashRestrictionCategory";
    public static final String VEHICLE_YEAR_ATTR_KEY = "vehicleManufactureYear";
    public static final String AGRICULTURAL_ATTR_KEY = "agriculturalProduct";

    public static final int VEHICLE_CASH_BAN_MAX_AGE_YEARS = 10;

    public boolean isAbsoluteCashBan() {
        return switch (this) {
            case ELECTRICITY, NATURAL_GAS, WATER_SUPPLY, GOVERNMENT_SERVICES,
                 ALCOHOL, TOBACCO, FUEL, EV_CHARGING, REAL_ESTATE -> true;
            default -> false;
        };
    }

    public boolean isAgriculturalException() {
        return this == AGRICULTURAL;
    }

    public boolean isVehicleAgeGated() {
        return this == VEHICLE_MNOG;
    }

    public static CashRestrictionCategory fromAttribute(String raw) {
        if (raw == null || raw.isBlank()) {
            return NONE;
        }
        String key = raw.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        try {
            return CashRestrictionCategory.valueOf(key);
        } catch (IllegalArgumentException ex) {
            return NONE;
        }
    }
}
