package com.pos.integrations.markingvalidation.mapper;

import com.pos.integrations.markingvalidation.client.OnkmValidationRequest;
import com.pos.integrations.markingvalidation.dto.ValidateMarkingRequest;
import org.springframework.util.StringUtils;

import java.util.List;

/** Касса DTO → тело `validation-onkm`. Без HTTP и без кассовых справочников. */
public final class OnkmRequestMapper {

    private OnkmRequestMapper() {
    }

    public static OnkmValidationRequest toRequest(
        String ownerTin,
        String terminalId,
        boolean refund,
        List<ValidateMarkingRequest.Product> products
    ) {
        return new OnkmValidationRequest(
            ownerTin,
            terminalId,
            refund ? 1 : 0,
            products.stream().map(OnkmRequestMapper::toWire).toList()
        );
    }

    static OnkmValidationRequest.Product toWire(ValidateMarkingRequest.Product product) {
        List<String> fullKmIds = product.fullKmIds() == null || product.fullKmIds().isEmpty()
            ? null
            : product.fullKmIds();
        return new OnkmValidationRequest.Product(
            StringUtils.hasText(product.commitentTin()) ? product.commitentTin() : null,
            product.productCode().trim(),
            StringUtils.hasText(product.packageCode()) ? product.packageCode().trim() : null,
            product.amount(),
            product.kmIds(),
            fullKmIds
        );
    }
}
