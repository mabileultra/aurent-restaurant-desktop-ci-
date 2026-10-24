package com.pos.integrations.markingvalidation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/** Запрос кассы. ИНН компании и Terminal ID Multikassa сервер берёт сам, не от клиента. */
public record ValidateMarkingRequest(
    @NotNull Long cashRegisterId,
    boolean refund,
    @NotEmpty @Size(max = 500) List<@Valid Product> products
) {

    public record Product(
        @NotBlank @Size(max = 18) String productCode,
        @Size(max = 20) String packageCode,
        @NotNull @DecimalMin("0.001") BigDecimal amount,
        @NotEmpty @Size(max = 300) List<@NotBlank @Size(max = 63) String> kmIds,
        @Size(max = 300) List<@Size(max = 255) String> fullKmIds,
        @Pattern(regexp = "^$|^\\d{9}$|^\\d{14}$") String commitentTin
    ) {
    }
}
