package com.pos.operator;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OperatorBrvServiceImplTest {

    @Test
    void cashLimitIsBrvTimesUnits() {
        OperatorBrvProperties props = new OperatorBrvProperties();
        props.setAmount(new BigDecimal("340000"));
        props.setCashLimitBrvUnits(new BigDecimal("74"));
        OperatorBrvServiceImpl service = new OperatorBrvServiceImpl(props);

        OperatorBrvResponse res = service.current();
        assertEquals(new BigDecimal("340000"), res.brvAmount());
        assertEquals(new BigDecimal("74"), res.cashLimitBrvUnits());
        assertEquals(new BigDecimal("25160000"), res.cashPaymentLimitSoum());
    }
}
