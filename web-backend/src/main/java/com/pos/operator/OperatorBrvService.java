package com.pos.operator;

import java.math.BigDecimal;

public interface OperatorBrvService {

    /** Текущая БРВ и порог налички (из API оператора / конфига). */
    OperatorBrvResponse current();

    /** Порог наличной оплаты в сумах. */
    BigDecimal cashPaymentLimitSoum();
}
