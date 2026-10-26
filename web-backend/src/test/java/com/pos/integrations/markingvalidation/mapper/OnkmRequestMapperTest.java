package com.pos.integrations.markingvalidation.mapper;

import com.pos.integrations.markingvalidation.client.OnkmValidationRequest;
import com.pos.integrations.markingvalidation.dto.ValidateMarkingRequest;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class OnkmRequestMapperTest {

    @Test
    void mapsCashierProductToTasnifWire() {
        ValidateMarkingRequest.Product product = new ValidateMarkingRequest.Product(
            "02208001001231004",
            "1803483",
            BigDecimal.ONE,
            List.of("0104780131182498217?ыПдК7"),
            List.of("0104780131182498217?ыПдК793Тоы2"),
            ""
        );

        OnkmValidationRequest request = OnkmRequestMapper.toRequest(
            "306653188",
            "VG544170030015",
            false,
            List.of(product)
        );

        assertThat(request.ownerTin()).isEqualTo("306653188");
        assertThat(request.terminalId()).isEqualTo("VG544170030015");
        assertThat(request.refund()).isZero();
        assertThat(request.products()).hasSize(1);
        assertThat(request.products().get(0).commitentTin()).isNull();
        assertThat(request.products().get(0).productCode()).isEqualTo("02208001001231004");
        assertThat(request.products().get(0).kmIds()).containsExactly("0104780131182498217?ыПдК7");
        assertThat(request.products().get(0).fullKmIds()).containsExactly("0104780131182498217?ыПдК793Тоы2");
    }
}
