package com.pos.shared.money;

import java.math.BigDecimal;

public record TenderNet(BigDecimal total, BigDecimal cash, BigDecimal card) {
}
