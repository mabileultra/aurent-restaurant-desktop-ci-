package com.pos.platform.service.support;

import com.pos.platform.config.BillingPaymentProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class BillingPaymentAuthTest {

    private BillingPaymentAuth auth;
    private BillingPaymentProperties props;

    @BeforeEach
    void setUp() {
        props = new BillingPaymentProperties();
        props.getClick().setEnabled(true);
        props.getClick().setMerchantId("64350");
        props.getClick().setServiceId("111392");
        props.getClick().setSecretKey("secret");
        auth = new BillingPaymentAuth(props);
    }

    @Test
    void clickConfigured_requiresEnabledAndIds() {
        assertThat(auth.clickConfigured()).isTrue();
        props.getClick().setEnabled(false);
        assertThat(auth.clickConfigured()).isFalse();
    }

    @Test
    void verifyClickSign_prepareOk() {
        Map<String, String> params = prepareParams();
        params.put("sign_string", ClickSignature.md5(
            params.get("click_trans_id")
                + params.get("service_id")
                + "secret"
                + params.get("merchant_trans_id")
                + params.get("amount")
                + params.get("action")
                + params.get("sign_time")
        ));
        assertThat(auth.verifyClickSign(params, false)).isTrue();
    }

    @Test
    void verifyClickSign_rejectsWrongSecret() {
        Map<String, String> params = prepareParams();
        params.put("sign_string", ClickSignature.md5(
            params.get("click_trans_id")
                + params.get("service_id")
                + "wrong"
                + params.get("merchant_trans_id")
                + params.get("amount")
                + params.get("action")
                + params.get("sign_time")
        ));
        assertThat(auth.verifyClickSign(params, false)).isFalse();
    }

    @Test
    void verifyClickSign_completeIncludesPrepareId() {
        Map<String, String> params = prepareParams();
        params.put("merchant_prepare_id", "42");
        params.put("action", "1");
        params.put("sign_string", ClickSignature.md5(
            params.get("click_trans_id")
                + params.get("service_id")
                + "secret"
                + params.get("merchant_trans_id")
                + params.get("merchant_prepare_id")
                + params.get("amount")
                + params.get("action")
                + params.get("sign_time")
        ));
        assertThat(auth.verifyClickSign(params, true)).isTrue();
    }

    @Test
    void verifyPaymeAuth_acceptsPaycomLoginAndTestKey() {
        props.getPayme().setEnabled(true);
        props.getPayme().setMerchantId("6aa7825732d93974d5db3b9e");
        props.getPayme().setSecretKey("prod-key");
        props.getPayme().setTestSecretKey("test-key");

        String header = "Basic " + java.util.Base64.getEncoder()
            .encodeToString("Paycom:test-key".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        assertThat(auth.verifyPaymeAuth(header)).isTrue();

        String prod = "Basic " + java.util.Base64.getEncoder()
            .encodeToString("Paycom:prod-key".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        assertThat(auth.verifyPaymeAuth(prod)).isTrue();

        String bad = "Basic " + java.util.Base64.getEncoder()
            .encodeToString("Paycom:wrong".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        assertThat(auth.verifyPaymeAuth(bad)).isFalse();
    }

    private static Map<String, String> prepareParams() {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("click_trans_id", "1001");
        params.put("service_id", "111392");
        params.put("merchant_trans_id", "11111111-1111-1111-1111-111111111111");
        params.put("amount", "100000.00");
        params.put("action", "0");
        params.put("sign_time", "2026-09-10 10:00:00");
        return params;
    }
}
