package com.pos.pharmacy.sales.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record SaleItemRequest(
    @NotNull UUID productId,
    @NotNull @DecimalMin("0.001") BigDecimal quantity,
    BigDecimal discount,
    /** Цена за единицу из кассы (если кассир изменил в чеке); иначе — из каталога. */
    @DecimalMin("0") BigDecimal unitPrice,
    /** DataMatrix КМ по упаковкам (повторная продажа запрещена). */
    List<String> productMarks
) {
    public SaleItemRequest {
        if (productMarks == null) {
            productMarks = List.of();
        }
    }
}
