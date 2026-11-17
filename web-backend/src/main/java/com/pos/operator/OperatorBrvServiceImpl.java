package com.pos.operator;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Service
@RequiredArgsConstructor
public class OperatorBrvServiceImpl implements OperatorBrvService {

    public static final ZoneId OPERATOR_ZONE = ZoneId.of("Asia/Tashkent");

    private final OperatorBrvProperties properties;
    private final Clock clock = Clock.systemUTC();

    @Override
    public OperatorBrvResponse current() {
        BigDecimal brv = normalize(properties.getAmount());
        BigDecimal units = normalize(properties.getCashLimitBrvUnits());
        BigDecimal limit = brv.multiply(units).setScale(0, RoundingMode.HALF_UP);
        Instant now = clock.instant();
        ZonedDateTime local = now.atZone(OPERATOR_ZONE);
        return new OperatorBrvResponse(
            brv,
            properties.getCurrency() != null ? properties.getCurrency() : "UZS",
            units,
            limit,
            local.toLocalDate().toString(),
            OPERATOR_ZONE.getId()
        );
    }

    @Override
    public BigDecimal cashPaymentLimitSoum() {
        return current().cashPaymentLimitSoum();
    }

    private static BigDecimal normalize(BigDecimal value) {
        if (value == null || value.signum() <= 0) {
            throw new IllegalStateException("Operator BRV config must be positive");
        }
        return value;
    }
}
