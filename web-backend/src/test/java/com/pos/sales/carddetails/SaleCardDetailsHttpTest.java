package com.pos.sales.carddetails;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.ThrowableProxyUtil;
import ch.qos.logback.core.read.ListAppender;
import com.pos.exception.GlobalExceptionHandler;
import com.pos.sales.controller.SaleController;
import com.pos.sales.dto.sale.CreateSaleRequest;
import com.pos.sales.entity.Sale;
import com.pos.sales.service.SaleService;
import com.pos.sales.service.sale.support.SaleCardDetailsApplier;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
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
 * AUR-17, seam C: полный номер соцкарты в POST /sales → 400 через настоящий обработчик ошибок.
 * Номера нет ни в теле ответа, ни в логах (в том числе в стектрейсах).
 */
class SaleCardDetailsHttpTest {

    private static final String FULL_NUMBER = "8600123456781234";
    private static final String NUMBER_MIDDLE = "12345678";

    private final SaleCardDetailsApplier applier = new SaleCardDetailsApplier();
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
    private final Logger root = (Logger) LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        SaleService saleService = mock(SaleService.class);
        when(saleService.processSale(any(), any())).thenAnswer(invocation -> {
            CreateSaleRequest req = invocation.getArgument(0);
            Sale sale = Sale.builder()
                .paymentMethod(Sale.PaymentMethod.valueOf(req.paymentMethod()))
                .cardAmount(new BigDecimal("1000.00"))
                .receiptType(Sale.ReceiptType.SALE)
                .build();
            applier.apply(sale, req);
            return null;
        });
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        ReflectionTestUtils.setField(handler, "includeContextInResponse", false);
        mvc = MockMvcBuilders.standaloneSetup(new SaleController(saleService))
            .setControllerAdvice(handler)
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
             "paymentMethod":"CARD","cardType":"UZCARD",
             "cardCategory":"SOCIAL","rrn":"123456789012","socialCardNumber":"%s"}
            """.formatted(FULL_NUMBER);

        MvcResult result = mvc.perform(post("/sales").contentType(MediaType.APPLICATION_JSON).content(body))
            .andReturn();

        String response = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(response)
            .contains("CARD_DETAILS_SOCIAL_NUMBER_UNMASKED")
            .doesNotContain(FULL_NUMBER)
            .doesNotContain(NUMBER_MIDDLE);
        assertThat(logs.list).isNotEmpty();
        assertThat(renderedLogs()).doesNotContain(FULL_NUMBER).doesNotContain(NUMBER_MIDDLE);
    }

    private String renderedLogs() {
        return logs.list.stream()
            .map(event -> event.getFormattedMessage()
                + (event.getThrowableProxy() != null ? ThrowableProxyUtil.asString(event.getThrowableProxy()) : ""))
            .collect(Collectors.joining("\n"));
    }
}
