package com.pos.restaurant.payment.carddetails;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.ThrowableProxyUtil;
import ch.qos.logback.core.read.ListAppender;
import com.pos.restaurant.exception.GlobalExceptionHandler;
import com.pos.restaurant.payment.controller.PaymentController;
import com.pos.restaurant.payment.dto.PayOrderRequest;
import com.pos.restaurant.payment.service.PaymentService;
import com.pos.restaurant.payment.support.PaymentCardDetailsPolicy;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * AUR-17, seam C: полный номер соцкарты в POST /rst/orders/{id}/pay → 400 через обработчик ошибок ресторана.
 * Номера нет ни в теле ответа, ни в логах.
 */
class PaymentCardDetailsHttpTest {

    private static final String FULL_NUMBER = "8600123456781234";
    private static final String NUMBER_MIDDLE = "12345678";

    private final PaymentCardDetailsPolicy policy = new PaymentCardDetailsPolicy();
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
    private final Logger root = (Logger) LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        PaymentService paymentService = mock(PaymentService.class);
        when(paymentService.pay(any(), any())).thenAnswer(invocation -> {
            PayOrderRequest req = invocation.getArgument(1);
            policy.resolve(invocation.getArgument(0), req, req.cardAmount());
            return null;
        });
        mvc = MockMvcBuilders.standaloneSetup(new PaymentController(paymentService))
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
            {"method":"CARD","amount":50000,"cardAmount":50000,"cardType":"UZCARD",
             "cardCategory":"SOCIAL","rrn":"123456789012","socialCardNumber":"%s"}
            """.formatted(FULL_NUMBER);

        MvcResult result = mvc.perform(post("/rst/orders/{id}/pay", UUID.randomUUID())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andReturn();

        String response = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(response).doesNotContain(FULL_NUMBER).doesNotContain(NUMBER_MIDDLE);
        assertThat(renderedLogs()).doesNotContain(FULL_NUMBER).doesNotContain(NUMBER_MIDDLE);
    }

    private String renderedLogs() {
        return logs.list.stream()
            .map(event -> event.getFormattedMessage()
                + (event.getThrowableProxy() != null ? ThrowableProxyUtil.asString(event.getThrowableProxy()) : ""))
            .collect(Collectors.joining("\n"));
    }
}
