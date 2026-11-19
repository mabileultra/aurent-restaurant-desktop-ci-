package com.pos.pharmacy.sales.prescription;

import com.pos.pharmacy.exception.GlobalExceptionHandler;
import com.pos.pharmacy.sales.controller.PharmacySaleController;
import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import com.pos.pharmacy.sales.service.PharmacySaleCheckoutService;
import com.pos.pharmacy.sales.service.PharmacySalePartialReturnService;
import com.pos.pharmacy.sales.service.PharmacySaleQueryService;
import com.pos.pharmacy.sales.service.PharmacySaleVoidService;
import com.pos.pharmacy.sales.service.PharmacySoldMarkService;
import com.pos.pharmacy.sales.support.PharmacySalePrescriptionGuard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * AUR-18: POST /pharmacy/sales с рецептурным препаратом при включённом флаге — 400
 * PHARM_SALE_PRESCRIPTION_NUMBER_REQUIRED / _INVALID через обработчик ошибок аптеки.
 */
class PharmacySalePrescriptionHttpTest {

    private static final UUID RX = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

    private final PharmacySalePrescriptionGuard guard = new PharmacySalePrescriptionGuard(true);
    private final AtomicReference<String> saved = new AtomicReference<>();
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        PharmacySaleCheckoutService checkout = mock(PharmacySaleCheckoutService.class);
        when(checkout.processSale(any(), any())).thenAnswer(invocation -> {
            CreateSaleRequest req = invocation.getArgument(0);
            saved.set(guard.resolve(req, Map.of(RX, Map.of("prescription_required", "true")), null));
            return null;
        });
        PharmacySaleController controller = new PharmacySaleController(
            checkout,
            mock(PharmacySaleVoidService.class),
            mock(PharmacySalePartialReturnService.class),
            mock(PharmacySaleQueryService.class),
            mock(PharmacySoldMarkService.class)
        );
        mvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @Test
    void prescriptionDrugWithoutNumberIs400Required() throws Exception {
        MvcResult result = post(null);

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(body(result)).contains("\"PHARM_SALE_PRESCRIPTION_NUMBER_REQUIRED\"");
    }

    @Test
    void badNumberIs400InvalidWithoutEchoingIt() throws Exception {
        MvcResult result = post("\"RX 777\"");

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(body(result)).contains("\"PHARM_SALE_PRESCRIPTION_NUMBER_INVALID\"").doesNotContain("RX 777");
    }

    @Test
    void validNumberFromJsonReachesTheSale() throws Exception {
        MvcResult result = post("\" RX-2026/001 \"");

        assertThat(result.getResponse().getStatus()).isEqualTo(201);
        assertThat(saved.get()).isEqualTo("RX-2026/001");
    }

    private MvcResult post(String prescriptionJson) throws Exception {
        String body = """
            {"items":[{"productId":"%s","quantity":1}],"paymentMethod":"CASH","storeId":1,
             "receiptType":"SALE","prescriptionNumber":%s}
            """.formatted(RX, prescriptionJson);
        return mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .post("/pharmacy/sales").contentType(MediaType.APPLICATION_JSON).content(body))
            .andReturn();
    }

    private static String body(MvcResult result) throws Exception {
        return result.getResponse().getContentAsString(StandardCharsets.UTF_8);
    }
}
