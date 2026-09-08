package com.pos.platform.service.support;

import com.pos.platform.config.BillingPaymentProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class BillingPaymentUrlBuilder {

    private final BillingPaymentProperties props;

    public String click(UUID intentId, BigDecimal amount) {
        return UriComponentsBuilder
            .fromUriString(props.getClick().getPayUrl())
            .queryParam("service_id", props.getClick().getServiceId())
            .queryParam("merchant_id", props.getClick().getMerchantId())
            .queryParam("amount", amount.toPlainString())
            .queryParam("transaction_param", intentId.toString())
            .queryParam("return_url", props.getReturnUrl())
            .encode(StandardCharsets.UTF_8)
            .build()
            .toUriString();
    }

    public String payme(UUID intentId, BigDecimal amount) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("m", props.getPayme().getMerchantId());
        payload.put("ac", Map.of("order_id", intentId.toString()));
        payload.put("a", toTiyin(amount));
        payload.put("c", props.getReturnUrl());
        String encoded = Base64.getEncoder().encodeToString(toJson(payload).getBytes(StandardCharsets.UTF_8));
        return props.getPayme().getCheckoutUrl() + "/" + encoded;
    }

    public static long toTiyin(BigDecimal amountUzs) {
        return amountUzs.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    private static String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : map.entrySet()) {
            if (!first) sb.append(',');
            first = false;
            sb.append('"').append(e.getKey()).append('"').append(':');
            Object v = e.getValue();
            if (v instanceof Map<?, ?> nested) {
                sb.append('{');
                boolean f2 = true;
                for (Map.Entry<?, ?> n : nested.entrySet()) {
                    if (!f2) sb.append(',');
                    f2 = false;
                    sb.append('"').append(n.getKey()).append('"').append(':')
                        .append('"').append(String.valueOf(n.getValue()).replace("\"", "\\\"")).append('"');
                }
                sb.append('}');
            } else if (v instanceof Number) {
                sb.append(v);
            } else {
                sb.append('"').append(String.valueOf(v).replace("\"", "\\\"")).append('"');
            }
        }
        return sb.append('}').toString();
    }
}
