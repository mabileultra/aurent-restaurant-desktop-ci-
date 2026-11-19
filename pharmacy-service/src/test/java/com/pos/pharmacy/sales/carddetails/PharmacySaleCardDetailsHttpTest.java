package com.pos.pharmacy.sales.carddetails;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.ThrowableProxyUtil;
import ch.qos.logback.core.read.ListAppender;
import com.pos.pharmacy.exception.GlobalExceptionHandler;
import com.pos.pharmacy.sales.controller.PharmacySaleController;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.service.PharmacySaleCheckoutService;
import com.pos.pharmacy.sales.service.PharmacySalePartialReturnService;
import com.pos.pharmacy.sales.service.PharmacySaleQueryService;
import com.pos.pharmacy.sales.service.PharmacySaleVoidService;
import com.pos.pharmacy.sales.service.PharmacySoldMarkService;
import com.pos.pharmacy.sales.support.PharmacySaleCardDetailsApplier;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * AUR-17, seam C: полный номер соцкарты в POST /pharmacy/sales → 400 через обработчик ошибок аптеки.
 * Номера нет ни в теле ответа, ни в логах.
 */
class PharmacySaleCardDetailsHttpTest {

    private static final String FULL_NUMBER = "8600123456781234";
    private static final String NUMBER_MIDDLE = "12345678";

    private final PharmacySaleCardDetailsApplier applier = new PharmacySaleCardDetailsApplier();
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
    private final Logger root = (Logger) LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        PharmacySaleCheckoutService checkout = mock(PharmacySaleCheckoutService.class);
        when(checkout.processSale(any(), any())).thenAnswer(invocation -> {
            CreateSaleRequest req = invocation.getArgument(0);
            Sale sale = Sale.builder()
                .paymentMethod(SaleEnums.PaymentMethod.valueOf(req.paymentMethod()))
                .cardAmount(new BigDecimal("1000.00"))
                .build();
            applier.apply(sale, req, false);
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
        logs.start();
        root.addAppender(logs);
    }

    @AfterEach
    void tearDown() {
        root.detachAppender(logs);
    }

    @Test
    void fullSocialCardNumberIs400WithoutNumberInBodyOrLogs() throws Exception {
        String body = """
            {"items":[{"productId":"550e8400-e29b-41d4-a716-446655440000","quantity":1}],
             "paymentMethod":"CARD","storeId":1,"cardType":"UZCARD",
             "cardCategory":"SOCIAL","rrn":"123456789012","socialCardNumber":"%s"}
            """.formatted(FULL_NUMBER);

        MvcResult result = mvc.perform(post("/pharmacy/sales").contentType(MediaType.APPLICATION_JSON).content(body))
            .andReturn();

        String response = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(response)
            .contains("PHARM_SALE_CARD_SOCIAL_NUMBER_UNMASKED")
            .doesNotContain(FULL_NUMBER)
            .doesNotContain(NUMBER_MIDDLE);
        assertThat(renderedLogs()).doesNotContain(FULL_NUMBER).doesNotContain(NUMBER_MIDDLE);
    }

    private String renderedLogs() {
        return logs.list.stream()
            .map(event -> event.getFormattedMessage()
                + (event.getThrowableProxy() != null ? ThrowableProxyUtil.asString(event.getThrowableProxy()) : ""))
            .collect(Collectors.joining("\n"));
    }
}
