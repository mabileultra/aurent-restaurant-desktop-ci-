package com.pos.platform.service.impl;

import com.pos.platform.config.BillingPaymentProperties;
import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.entity.BillingPaymentIntent;
import com.pos.platform.repository.BillingPaymentIntentRepository;
import com.pos.platform.service.BillingPaymentCreditService;
import com.pos.platform.service.support.BillingPaymentAuth;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymeBillingCallbackServiceImplTest {

    private static final UUID ORDER_ID = UUID.fromString("667dea7a-b080-49b2-b67f-1d0e4db5e542");
    private static final String PAYME_ID_FIRST = "6aa7f3cf8d84b820a3b81b06";
    private static final String PAYME_ID_SECOND = "6aa7f3cf8d84b820a3b81b07";

    @Mock
    private BillingPaymentIntentRepository intentRepository;
    @Mock
    private BillingPaymentCreditService creditService;
    @Mock
    private BillingPaymentAuth auth;

    private PaymeBillingCallbackServiceImpl service;

    private BillingPaymentProperties paymentProperties;

    @BeforeEach
    void setUp() {
        paymentProperties = new BillingPaymentProperties();
        paymentProperties.getPayme().setEnabled(true);
        paymentProperties.getPayme().setMerchantId("6aa7825732d93974d5db3b9e");
        paymentProperties.getPayme().setSecretKey("test-key");
        paymentProperties.getPayme().setTestSecretKey("test-key");
        service = new PaymeBillingCallbackServiceImpl(
            intentRepository,
            creditService,
            auth,
            paymentProperties
        );
        when(auth.paymeConfigured()).thenReturn(true);
        when(auth.verifyPaymeAuth(any())).thenReturn(true);
    }

    @Test
    void createTransaction_keepsFirstPaymeIdWhenPrepared() {
        BillingPaymentIntent intent = preparedIntent(PAYME_ID_FIRST);
        long stored = 1_789_473_165_910L;
        intent.setProviderPrepareId(String.valueOf(stored));
        when(intentRepository.findById(ORDER_ID)).thenReturn(Optional.of(intent));
        when(intentRepository.findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, PAYME_ID_SECOND))
            .thenReturn(Optional.empty());

        @SuppressWarnings("unchecked")
        Map<String, Object> response = (Map<String, Object>) service.handle(
            createBody(PAYME_ID_SECOND),
            authHeader()
        );

        assertThat(response).doesNotContainKey("error");
        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) response.get("result");
        assertThat(result.get("state")).isEqualTo(1);
        assertThat(result.get("create_time")).isEqualTo(stored);
        assertThat(intent.getProviderTransId()).isEqualTo(PAYME_ID_FIRST);
        verify(intentRepository, never()).save(any());
    }

    @Test
    void createTransaction_usesPaymeTimeAsCreateTimeOnFirstCreate() {
        BillingPaymentIntent intent = pendingIntent();
        when(intentRepository.findById(ORDER_ID)).thenReturn(Optional.of(intent));
        when(intentRepository.findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, PAYME_ID_SECOND))
            .thenReturn(Optional.empty());
        when(intentRepository.save(intent)).thenAnswer(inv -> inv.getArgument(0));

        long paymeTime = 1_789_473_165_910L;
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("id", PAYME_ID_SECOND);
        params.put("time", paymeTime);
        params.put("amount", 200_000L);
        params.put("account", Map.of("order_id", ORDER_ID.toString()));

        @SuppressWarnings("unchecked")
        Map<String, Object> response = (Map<String, Object>) service.handle(
            Map.of("jsonrpc", "2.0", "id", 13358, "method", "CreateTransaction", "params", params),
            authHeader()
        );

        assertThat(response).doesNotContainKey("error");
        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) response.get("result");
        assertThat(result.get("create_time")).isEqualTo(paymeTime);
        assertThat(intent.getProviderTransId()).isEqualTo(PAYME_ID_SECOND);
        assertThat(intent.getProviderPrepareId()).isEqualTo(String.valueOf(paymeTime));
        verify(intentRepository).save(intent);
    }

    @Test
    void createTransaction_samePaymeIdReturnsStoredCreateTime() {
        BillingPaymentIntent intent = preparedIntent(PAYME_ID_FIRST);
        long stored = 1_789_473_165_910L;
        intent.setProviderPrepareId(String.valueOf(stored));
        when(intentRepository.findById(ORDER_ID)).thenReturn(Optional.of(intent));
        when(intentRepository.findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, PAYME_ID_FIRST))
            .thenReturn(Optional.of(intent));

        @SuppressWarnings("unchecked")
        Map<String, Object> response = (Map<String, Object>) service.handle(
            createBody(PAYME_ID_FIRST),
            authHeader()
        );

        assertThat(response).doesNotContainKey("error");
        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) response.get("result");
        assertThat(result.get("create_time")).isEqualTo(stored);
        verify(intentRepository, never()).save(any());
    }

    @Test
    void performTransaction_findsStoredPaymeId() {
        BillingPaymentIntent intent = preparedIntent(PAYME_ID_FIRST);
        when(intentRepository.findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, PAYME_ID_FIRST))
            .thenReturn(Optional.of(intent));
        when(intentRepository.findById(intent.getId())).thenReturn(Optional.of(intent));

        @SuppressWarnings("unchecked")
        Map<String, Object> response = (Map<String, Object>) service.handle(
            performBody(PAYME_ID_FIRST),
            authHeader()
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) response.get("result");
        assertThat(result.get("state")).isEqualTo(2);
        verify(creditService).markPaid(intent, PAYME_ID_FIRST, "Пополнение через Payme");
    }

    @Test
    void createTransaction_storesFirstPaymeId() {
        BillingPaymentIntent intent = pendingIntent();
        when(intentRepository.findById(ORDER_ID)).thenReturn(Optional.of(intent));
        when(intentRepository.findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, PAYME_ID_FIRST))
            .thenReturn(Optional.empty());
        when(intentRepository.save(intent)).thenAnswer(inv -> inv.getArgument(0));

        service.handle(createBody(PAYME_ID_FIRST), authHeader());

        ArgumentCaptor<BillingPaymentIntent> captor = ArgumentCaptor.forClass(BillingPaymentIntent.class);
        verify(intentRepository).save(captor.capture());
        assertThat(captor.getValue().getProviderTransId()).isEqualTo(PAYME_ID_FIRST);
        assertThat(captor.getValue().getStatus()).isEqualTo(BillingPaymentStatus.PREPARED);
    }

    @Test
    void checkPerform_allowsAnyPositiveAmount() {
        BillingPaymentIntent intent = pendingIntent(); // stored as 1000 UZS
        when(intentRepository.findById(ORDER_ID)).thenReturn(Optional.of(intent));

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("amount", 777_00L); // 777 UZS — differs from intent
        params.put("account", Map.of("order_id", ORDER_ID.toString()));

        @SuppressWarnings("unchecked")
        Map<String, Object> response = (Map<String, Object>) service.handle(
            Map.of("jsonrpc", "2.0", "id", 10, "method", "CheckPerformTransaction", "params", params),
            authHeader()
        );

        assertThat(response).doesNotContainKey("error");
        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) response.get("result");
        assertThat(result.get("allow")).isEqualTo(true);
    }

    @Test
    void createTransaction_updatesAmountFromPayme() {
        BillingPaymentIntent intent = pendingIntent(); // 1000 UZS
        when(intentRepository.findById(ORDER_ID)).thenReturn(Optional.of(intent));
        when(intentRepository.findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, PAYME_ID_FIRST))
            .thenReturn(Optional.empty());
        when(intentRepository.save(intent)).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("id", PAYME_ID_FIRST);
        params.put("time", 1_757_862_028_000L);
        params.put("amount", 500_000L); // 5000 UZS
        params.put("account", Map.of("order_id", ORDER_ID.toString()));

        service.handle(
            Map.of("jsonrpc", "2.0", "id", 11, "method", "CreateTransaction", "params", params),
            authHeader()
        );

        assertThat(intent.getAmount()).isEqualByComparingTo("5000.00");
        assertThat(intent.getStatus()).isEqualTo(BillingPaymentStatus.PREPARED);
        assertThat(intent.getProviderPrepareId()).isEqualTo("1757862028000");
    }

    @Test
    void createTransaction_reopensPaidOrderWithNewPaymeId() {
        BillingPaymentIntent intent = preparedIntent(PAYME_ID_FIRST);
        intent.setStatus(BillingPaymentStatus.PAID);
        intent.setPaidAt(Instant.parse("2026-09-14T12:30:00Z"));
        when(intentRepository.findById(ORDER_ID)).thenReturn(Optional.of(intent));
        when(intentRepository.findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, PAYME_ID_SECOND))
            .thenReturn(Optional.empty());
        when(intentRepository.save(intent)).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("id", PAYME_ID_SECOND);
        params.put("time", 1_757_862_028_000L);
        params.put("amount", 250_000L);
        params.put("account", Map.of("order_id", ORDER_ID.toString()));

        @SuppressWarnings("unchecked")
        Map<String, Object> response = (Map<String, Object>) service.handle(
            Map.of("jsonrpc", "2.0", "id", 12, "method", "CreateTransaction", "params", params),
            authHeader()
        );

        assertThat(response).doesNotContainKey("error");
        assertThat(intent.getProviderTransId()).isEqualTo(PAYME_ID_SECOND);
        assertThat(intent.getStatus()).isEqualTo(BillingPaymentStatus.PREPARED);
        assertThat(intent.getAmount()).isEqualByComparingTo("2500.00");
        assertThat(intent.getPaidAt()).isNull();
    }

    private static BillingPaymentIntent pendingIntent() {
        return BillingPaymentIntent.builder()
            .id(ORDER_ID)
            .companyId(1)
            .provider(BillingPaymentProvider.PAYME)
            .amount(new BigDecimal("1000.00"))
            .status(BillingPaymentStatus.PENDING)
            .createdAt(Instant.parse("2026-09-14T12:20:28Z"))
            .updatedAt(Instant.parse("2026-09-14T12:20:28Z"))
            .build();
    }

    private static BillingPaymentIntent preparedIntent(String paymeId) {
        return BillingPaymentIntent.builder()
            .id(ORDER_ID)
            .companyId(1)
            .provider(BillingPaymentProvider.PAYME)
            .amount(new BigDecimal("1000.00"))
            .status(BillingPaymentStatus.PREPARED)
            .providerTransId(paymeId)
            .createdAt(Instant.parse("2026-09-14T12:20:28Z"))
            .updatedAt(Instant.parse("2026-09-14T12:20:28Z"))
            .build();
    }

    private static Map<String, Object> createBody(String paymeId) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("id", paymeId);
        params.put("time", 1_757_862_028_000L);
        params.put("amount", 100_000L);
        params.put("account", Map.of("order_id", ORDER_ID.toString()));
        return Map.of(
            "jsonrpc", "2.0",
            "id", 1,
            "method", "CreateTransaction",
            "params", params
        );
    }

    private static Map<String, Object> performBody(String paymeId) {
        return Map.of(
            "jsonrpc", "2.0",
            "id", 2,
            "method", "PerformTransaction",
            "params", Map.of("id", paymeId)
        );
    }

    private static String authHeader() {
        return "Basic " + Base64.getEncoder()
            .encodeToString("Paycom:test-key".getBytes(StandardCharsets.UTF_8));
    }
}
