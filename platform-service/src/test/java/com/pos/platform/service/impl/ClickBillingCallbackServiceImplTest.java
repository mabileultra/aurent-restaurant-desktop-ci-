package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.entity.BillingPaymentIntent;
import com.pos.platform.repository.BillingPaymentIntentRepository;
import com.pos.platform.service.BillingPaymentCreditService;
import com.pos.platform.service.support.BillingPaymentAuth;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClickBillingCallbackServiceImplTest {

    private static final UUID INTENT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock
    private BillingPaymentIntentRepository intentRepository;
    @Mock
    private BillingPaymentCreditService creditService;
    @Mock
    private BillingPaymentAuth auth;

    private ClickBillingCallbackServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ClickBillingCallbackServiceImpl(intentRepository, creditService, auth);
    }

    @Test
    void prepare_disabled_returnsMinus9() {
        when(auth.clickConfigured()).thenReturn(false);
        Map<String, Object> result = service.prepare(baseParams(false));
        assertThat(result.get("error")).isEqualTo(-9);
    }

    @Test
    void prepare_badSign_returnsMinus1() {
        when(auth.clickConfigured()).thenReturn(true);
        when(auth.verifyClickSign(any(), eq(false))).thenReturn(false);
        Map<String, Object> result = service.prepare(baseParams(false));
        assertThat(result.get("error")).isEqualTo(-1);
    }

    @Test
    void prepare_missingOrder_returnsMinus5() {
        when(auth.clickConfigured()).thenReturn(true);
        when(auth.verifyClickSign(any(), eq(false))).thenReturn(true);
        when(intentRepository.findById(INTENT_ID)).thenReturn(Optional.empty());
        Map<String, Object> result = service.prepare(baseParams(false));
        assertThat(result.get("error")).isEqualTo(-5);
    }

    @Test
    void prepare_wrongAmount_returnsMinus2() {
        when(auth.clickConfigured()).thenReturn(true);
        when(auth.verifyClickSign(any(), eq(false))).thenReturn(true);
        when(intentRepository.findById(INTENT_ID)).thenReturn(Optional.of(intent(BillingPaymentStatus.PENDING, "50000.00")));
        Map<String, Object> result = service.prepare(baseParams(false));
        assertThat(result.get("error")).isEqualTo(-2);
    }

    @Test
    void prepare_alreadyPaid_returnsMinus4() {
        when(auth.clickConfigured()).thenReturn(true);
        when(auth.verifyClickSign(any(), eq(false))).thenReturn(true);
        when(intentRepository.findById(INTENT_ID)).thenReturn(Optional.of(intent(BillingPaymentStatus.PAID, "100000.00")));
        Map<String, Object> result = service.prepare(baseParams(false));
        assertThat(result.get("error")).isEqualTo(-4);
    }

    @Test
    void prepare_ok_marksPrepared() {
        when(auth.clickConfigured()).thenReturn(true);
        when(auth.verifyClickSign(any(), eq(false))).thenReturn(true);
        BillingPaymentIntent pending = intent(BillingPaymentStatus.PENDING, "100000.00");
        when(intentRepository.findById(INTENT_ID)).thenReturn(Optional.of(pending));
        when(intentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = service.prepare(baseParams(false));

        assertThat(result.get("error")).isEqualTo(0);
        assertThat(pending.getStatus()).isEqualTo(BillingPaymentStatus.PREPARED);
        assertThat(result.get("merchant_prepare_id")).isNotNull();
    }

    @Test
    void complete_ok_creditsOnce() {
        when(auth.clickConfigured()).thenReturn(true);
        when(auth.verifyClickSign(any(), eq(true))).thenReturn(true);
        BillingPaymentIntent prepared = intent(BillingPaymentStatus.PREPARED, "100000.00");
        prepared.setProviderPrepareId("42");
        when(intentRepository.findById(INTENT_ID)).thenReturn(Optional.of(prepared));

        Map<String, Object> result = service.complete(completeParams());

        assertThat(result.get("error")).isEqualTo(0);
        verify(creditService).markPaid(eq(prepared), eq("1001"), anyString());
    }

    @Test
    void complete_alreadyPaid_doesNotCreditAgain() {
        when(auth.clickConfigured()).thenReturn(true);
        when(auth.verifyClickSign(any(), eq(true))).thenReturn(true);
        BillingPaymentIntent paid = intent(BillingPaymentStatus.PAID, "100000.00");
        paid.setProviderPrepareId("42");
        when(intentRepository.findById(INTENT_ID)).thenReturn(Optional.of(paid));

        Map<String, Object> result = service.complete(completeParams());

        assertThat(result.get("error")).isEqualTo(-4);
        verify(creditService, never()).markPaid(any(), anyString(), anyString());
    }

    @Test
    void complete_clickCancel_marksCancelledWithoutCredit() {
        when(auth.clickConfigured()).thenReturn(true);
        when(auth.verifyClickSign(any(), eq(true))).thenReturn(true);
        BillingPaymentIntent prepared = intent(BillingPaymentStatus.PREPARED, "100000.00");
        prepared.setProviderPrepareId("42");
        when(intentRepository.findById(INTENT_ID)).thenReturn(Optional.of(prepared));
        when(intentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, String> params = completeParams();
        params.put("error", "-1");
        params.put("error_note", "User cancelled");
        Map<String, Object> result = service.complete(params);

        assertThat(result.get("error")).isEqualTo(-9);
        assertThat(prepared.getStatus()).isEqualTo(BillingPaymentStatus.CANCELLED);
        verify(creditService, never()).markPaid(any(), anyString(), anyString());
    }

    private static BillingPaymentIntent intent(BillingPaymentStatus status, String amount) {
        return BillingPaymentIntent.builder()
            .id(INTENT_ID)
            .companyId(1)
            .provider(BillingPaymentProvider.CLICK)
            .amount(new BigDecimal(amount))
            .currency("UZS")
            .status(status)
            .build();
    }

    private static Map<String, String> baseParams(boolean complete) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("click_trans_id", "1001");
        params.put("service_id", "111392");
        params.put("merchant_trans_id", INTENT_ID.toString());
        params.put("amount", "100000.00");
        params.put("action", complete ? "1" : "0");
        params.put("sign_time", "2026-09-10 10:00:00");
        params.put("error", "0");
        return params;
    }

    private static Map<String, String> completeParams() {
        Map<String, String> params = baseParams(true);
        params.put("merchant_prepare_id", "42");
        return params;
    }
}
