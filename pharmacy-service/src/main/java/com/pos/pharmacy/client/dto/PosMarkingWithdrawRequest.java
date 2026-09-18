package com.pos.pharmacy.client.dto;

import java.util.List;

public record PosMarkingWithdrawRequest(
    Integer storeId,
    List<String> codes,
    Boolean fiscalConfirmed
) {
}
