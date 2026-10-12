package com.pos.integrations.markingvalidation.client;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.util.List;

/** Тело запроса `validation-onkm` (формат налоговой). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OnkmValidationRequest(
    String ownerTin,
    String terminalId,
    int refund,
    List<Product> products
) {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Product(
        String commitentTin,
        String productCode,
        String packageCode,
        BigDecimal amount,
        List<String> kmIds,
        List<String> fullKmIds
    ) {
    }
}
