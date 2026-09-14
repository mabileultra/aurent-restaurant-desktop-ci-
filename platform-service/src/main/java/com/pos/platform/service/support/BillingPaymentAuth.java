package com.pos.platform.service.support;

import com.pos.platform.config.BillingPaymentProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class BillingPaymentAuth {

    private final BillingPaymentProperties props;

    public boolean clickConfigured() {
        var c = props.getClick();
        return c.isEnabled() && notBlank(c.getMerchantId()) && notBlank(c.getServiceId()) && notBlank(c.getSecretKey());
    }

    public boolean paymeConfigured() {
        var p = props.getPayme();
        return p.isEnabled() && notBlank(p.getMerchantId()) && notBlank(p.getSecretKey());
    }

    public boolean verifyClickSign(Map<String, String> params, boolean complete) {
        String clickTransId = str(params.get("click_trans_id"));
        String serviceId = str(params.get("service_id"));
        String secret = props.getClick().getSecretKey();
        String merchantTransId = str(params.get("merchant_trans_id"));
        String amount = str(params.get("amount"));
        String action = str(params.get("action"));
        String signTime = str(params.get("sign_time"));
        String provided = str(params.get("sign_string"));
        String raw = complete
            ? clickTransId + serviceId + secret + merchantTransId + str(params.get("merchant_prepare_id")) + amount + action + signTime
            : clickTransId + serviceId + secret + merchantTransId + amount + action + signTime;
        return ClickSignature.matches(ClickSignature.md5(raw), provided);
    }

    public boolean verifyPaymeAuth(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Basic ")) {
            return false;
        }
        try {
            String decoded = new String(Base64.getDecoder().decode(authHeader.substring(6)), StandardCharsets.UTF_8);
            int idx = decoded.indexOf(':');
            String login = idx >= 0 ? decoded.substring(0, idx) : "";
            String key = idx >= 0 ? decoded.substring(idx + 1) : decoded;
            // Payme: login обычно "Paycom"; password = KEY или TEST KEY
            if (notBlank(login)
                && !"Paycom".equalsIgnoreCase(login)
                && !login.equals(props.getPayme().getMerchantId())) {
                return false;
            }
            return matchesPaymeSecret(key);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean matchesPaymeSecret(String key) {
        if (!notBlank(key)) {
            return false;
        }
        var p = props.getPayme();
        if (key.equals(p.getSecretKey())) {
            return true;
        }
        return notBlank(p.getTestSecretKey()) && key.equals(p.getTestSecretKey());
    }

    private static String str(String v) {
        return v == null ? "" : v;
    }

    private static boolean notBlank(String v) {
        return v != null && !v.isBlank();
    }
}
