package com.pos.platform.service.impl;

import com.pos.platform.config.BillingPaymentProperties;
import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.dto.billing.BillingPaymentCreateResponse;
import com.pos.platform.entity.BillingPaymentIntent;
import com.pos.platform.entity.CompanyBilling;
import com.pos.platform.exception.BadRequestException;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.repository.BillingPaymentIntentRepository;
import com.pos.platform.repository.CompanyBillingRepository;
import com.pos.platform.security.PlatformTenantContext;
import com.pos.platform.service.BillingLedgerService;
import com.pos.platform.service.BillingPaymentService;
import com.pos.platform.service.CompanyBillingAccountService;
import com.pos.platform.service.support.BillingMoney;
import com.pos.platform.service.support.BillingTenantSupport;
import com.pos.platform.service.support.ClickSignature;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillingPaymentServiceImpl implements BillingPaymentService {

    private static final int PAYME_STATE_CREATED = 1;
    private static final int PAYME_STATE_DONE = 2;
    private static final int PAYME_STATE_CANCELLED = -1;
    private static final int PAYME_STATE_CANCELLED_AFTER = -2;

    private final BillingPaymentIntentRepository intentRepository;
    private final CompanyBillingRepository companyBillingRepository;
    private final CompanyBillingAccountService accountService;
    private final BillingLedgerService ledgerService;
    private final BillingPaymentProperties props;

    @Override
    @Transactional
    public BillingPaymentCreateResponse createPayment(BillingPaymentProvider provider, BigDecimal amount) {
        Integer companyId = BillingTenantSupport.requireCompanyId();
        BigDecimal money = BillingMoney.of(amount);
        if (money.signum() <= 0) {
            throw new BadRequestException("Сумма должна быть больше 0");
        }
        if (provider == BillingPaymentProvider.CLICK && !isClickConfigured()) {
            throw new BadRequestException("Click не настроен. Укажите CLICK_MERCHANT_ID / SERVICE_ID / SECRET_KEY.");
        }
        if (provider == BillingPaymentProvider.PAYME && !isPaymeConfigured()) {
            throw new BadRequestException("Payme не настроен. Укажите PAYME_MERCHANT_ID / SECRET_KEY.");
        }

        accountService.requireOrCreateBilling(companyId);
        BillingPaymentIntent intent = intentRepository.save(BillingPaymentIntent.builder()
            .companyId(companyId)
            .provider(provider)
            .amount(money)
            .currency("UZS")
            .status(BillingPaymentStatus.PENDING)
            .createdByUserId(PlatformTenantContext.getUserId())
            .build());

        String paymentUrl = provider == BillingPaymentProvider.CLICK
            ? buildClickUrl(intent.getId(), money)
            : buildPaymeUrl(intent.getId(), money);

        return new BillingPaymentCreateResponse(
            intent.getId(),
            provider,
            money,
            intent.getStatus(),
            paymentUrl
        );
    }

    @Override
    @Transactional
    public Map<String, Object> clickPrepare(Map<String, String> params) {
        if (!isClickConfigured()) {
            return clickError(params, -9, "Click disabled");
        }
        if (!verifyClickSign(params, false)) {
            return clickError(params, -1, "Invalid sign");
        }
        UUID intentId = parseUuid(params.get("merchant_trans_id"));
        if (intentId == null) {
            return clickError(params, -5, "Order not found");
        }
        BillingPaymentIntent intent = intentRepository.findById(intentId).orElse(null);
        if (intent == null || intent.getProvider() != BillingPaymentProvider.CLICK) {
            return clickError(params, -5, "Order not found");
        }
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return clickError(params, -4, "Already paid");
        }
        BigDecimal amount = parseDecimal(params.get("amount"));
        if (amount == null || amount.compareTo(intent.getAmount()) != 0) {
            return clickError(params, -2, "Incorrect amount");
        }

        intent.setStatus(BillingPaymentStatus.PREPARED);
        intent.setProviderTransId(params.get("click_trans_id"));
        intent.setProviderPrepareId(String.valueOf(Math.abs(intent.getId().getMostSignificantBits() % 1_000_000_000L)));
        intentRepository.save(intent);

        Map<String, Object> ok = new LinkedHashMap<>();
        ok.put("click_trans_id", params.get("click_trans_id"));
        ok.put("merchant_trans_id", intent.getId().toString());
        ok.put("merchant_prepare_id", Integer.parseInt(intent.getProviderPrepareId()));
        ok.put("error", 0);
        ok.put("error_note", "Success");
        return ok;
    }

    @Override
    @Transactional
    public Map<String, Object> clickComplete(Map<String, String> params) {
        if (!isClickConfigured()) {
            return clickError(params, -9, "Click disabled");
        }
        if (!verifyClickSign(params, true)) {
            return clickError(params, -1, "Invalid sign");
        }

        int error = parseInt(params.get("error"), 0);
        UUID intentId = parseUuid(params.get("merchant_trans_id"));
        BillingPaymentIntent intent = intentId == null ? null : intentRepository.findById(intentId).orElse(null);
        if (intent == null || intent.getProvider() != BillingPaymentProvider.CLICK) {
            return clickError(params, -5, "Order not found");
        }

        if (error < 0) {
            intent.setStatus(BillingPaymentStatus.CANCELLED);
            intent.setErrorNote(params.get("error_note"));
            intentRepository.save(intent);
            Map<String, Object> ok = new LinkedHashMap<>();
            ok.put("click_trans_id", params.get("click_trans_id"));
            ok.put("merchant_trans_id", intent.getId().toString());
            ok.put("merchant_confirm_id", intent.getProviderPrepareId());
            ok.put("error", -9);
            ok.put("error_note", "Transaction cancelled");
            return ok;
        }

        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            Map<String, Object> ok = new LinkedHashMap<>();
            ok.put("click_trans_id", params.get("click_trans_id"));
            ok.put("merchant_trans_id", intent.getId().toString());
            ok.put("merchant_confirm_id", intent.getProviderPrepareId());
            ok.put("error", -4);
            ok.put("error_note", "Already paid");
            return ok;
        }

        BigDecimal amount = parseDecimal(params.get("amount"));
        if (amount == null || amount.compareTo(intent.getAmount()) != 0) {
            return clickError(params, -2, "Incorrect amount");
        }

        markPaid(intent, params.get("click_trans_id"), "Пополнение через Click");
        Map<String, Object> ok = new LinkedHashMap<>();
        ok.put("click_trans_id", params.get("click_trans_id"));
        ok.put("merchant_trans_id", intent.getId().toString());
        ok.put("merchant_confirm_id", intent.getProviderPrepareId());
        ok.put("error", 0);
        ok.put("error_note", "Success");
        return ok;
    }

    @Override
    @Transactional
    public Object paymeHandle(Map<String, Object> body, String authHeader) {
        if (!isPaymeConfigured()) {
            return paymeError(body, -32400, "Payme disabled");
        }
        if (!verifyPaymeAuth(authHeader)) {
            return paymeError(body, -32504, "Insufficient privilege");
        }

        String method = String.valueOf(body.get("method"));
        Object id = body.get("id");
        @SuppressWarnings("unchecked")
        Map<String, Object> params = body.get("params") instanceof Map<?, ?> m
            ? (Map<String, Object>) m
            : Map.of();

        return switch (method) {
            case "CheckPerformTransaction" -> paymeCheckPerform(id, params);
            case "CreateTransaction" -> paymeCreate(id, params);
            case "PerformTransaction" -> paymePerform(id, params);
            case "CancelTransaction" -> paymeCancel(id, params);
            case "CheckTransaction" -> paymeCheck(id, params);
            case "GetStatement" -> Map.of("jsonrpc", "2.0", "id", id, "result", Map.of("transactions", List.of()));
            default -> paymeError(body, -32601, "Method not found");
        };
    }

    @Override
    @Transactional(readOnly = true)
    public BillingPaymentIntent requireIntent(UUID id) {
        return intentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Платёж не найден"));
    }

    private Map<String, Object> paymeCheckPerform(Object id, Map<String, Object> params) {
        BigDecimal amountTiyin = toDecimal(params.get("amount"));
        BillingPaymentIntent intent = resolvePaymeIntent(params);
        if (intent == null) {
            return paymeError(id, -31050, "Order not found");
        }
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return paymeError(id, -31051, "Already paid");
        }
        long expected = toTiyin(intent.getAmount());
        if (amountTiyin == null || amountTiyin.longValue() != expected) {
            return paymeError(id, -31001, "Invalid amount");
        }
        return Map.of("jsonrpc", "2.0", "id", id, "result", Map.of("allow", true));
    }

    private Map<String, Object> paymeCreate(Object id, Map<String, Object> params) {
        BillingPaymentIntent intent = resolvePaymeIntent(params);
        if (intent == null) {
            return paymeError(id, -31050, "Order not found");
        }
        BigDecimal amountTiyin = toDecimal(params.get("amount"));
        if (amountTiyin == null || amountTiyin.longValue() != toTiyin(intent.getAmount())) {
            return paymeError(id, -31001, "Invalid amount");
        }
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return paymeError(id, -31051, "Already paid");
        }
        String paymeId = String.valueOf(params.get("id"));
        intent.setProviderTransId(paymeId);
        intent.setStatus(BillingPaymentStatus.PREPARED);
        intent.setProviderPrepareId(String.valueOf(intent.getCreatedAt().toEpochMilli()));
        intentRepository.save(intent);
        return Map.of(
            "jsonrpc", "2.0",
            "id", id,
            "result", Map.of(
                "create_time", intent.getCreatedAt().toEpochMilli(),
                "transaction", intent.getId().toString(),
                "state", PAYME_STATE_CREATED
            )
        );
    }

    private Map<String, Object> paymePerform(Object id, Map<String, Object> params) {
        String paymeId = String.valueOf(params.get("id"));
        BillingPaymentIntent intent = intentRepository
            .findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, paymeId)
            .orElseGet(() -> {
                // sometimes Perform is called with same id after Create stored on intent
                return intentRepository.findAll().stream()
                    .filter(i -> paymeId.equals(i.getProviderTransId()))
                    .findFirst()
                    .orElse(null);
            });
        if (intent == null) {
            // fallback: transaction field may be our UUID
            UUID maybe = parseUuid(String.valueOf(params.get("id")));
            intent = maybe == null ? null : intentRepository.findById(maybe).orElse(null);
        }
        if (intent == null) {
            return paymeError(id, -31003, "Transaction not found");
        }
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return Map.of(
                "jsonrpc", "2.0",
                "id", id,
                "result", Map.of(
                    "transaction", intent.getId().toString(),
                    "perform_time", intent.getPaidAt() != null ? intent.getPaidAt().toEpochMilli() : Instant.now().toEpochMilli(),
                    "state", PAYME_STATE_DONE
                )
            );
        }
        markPaid(intent, paymeId, "Пополнение через Payme");
        return Map.of(
            "jsonrpc", "2.0",
            "id", id,
            "result", Map.of(
                "transaction", intent.getId().toString(),
                "perform_time", intent.getPaidAt().toEpochMilli(),
                "state", PAYME_STATE_DONE
            )
        );
    }

    private Map<String, Object> paymeCancel(Object id, Map<String, Object> params) {
        String paymeId = String.valueOf(params.get("id"));
        BillingPaymentIntent intent = intentRepository
            .findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, paymeId)
            .orElse(null);
        if (intent == null) {
            return paymeError(id, -31003, "Transaction not found");
        }
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            // do not auto-refund balance in v1
            intent.setStatus(BillingPaymentStatus.CANCELLED);
            intent.setErrorNote("Cancelled after pay (manual review)");
            intentRepository.save(intent);
            return Map.of(
                "jsonrpc", "2.0",
                "id", id,
                "result", Map.of(
                    "transaction", intent.getId().toString(),
                    "cancel_time", Instant.now().toEpochMilli(),
                    "state", PAYME_STATE_CANCELLED_AFTER
                )
            );
        }
        intent.setStatus(BillingPaymentStatus.CANCELLED);
        intentRepository.save(intent);
        return Map.of(
            "jsonrpc", "2.0",
            "id", id,
            "result", Map.of(
                "transaction", intent.getId().toString(),
                "cancel_time", Instant.now().toEpochMilli(),
                "state", PAYME_STATE_CANCELLED
            )
        );
    }

    private Map<String, Object> paymeCheck(Object id, Map<String, Object> params) {
        String paymeId = String.valueOf(params.get("id"));
        BillingPaymentIntent intent = intentRepository
            .findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, paymeId)
            .orElse(null);
        if (intent == null) {
            return paymeError(id, -31003, "Transaction not found");
        }
        int state = switch (intent.getStatus()) {
            case PAID -> PAYME_STATE_DONE;
            case CANCELLED, FAILED -> PAYME_STATE_CANCELLED;
            default -> PAYME_STATE_CREATED;
        };
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("create_time", intent.getCreatedAt().toEpochMilli());
        result.put("perform_time", intent.getPaidAt() != null ? intent.getPaidAt().toEpochMilli() : 0);
        result.put("cancel_time", intent.getStatus() == BillingPaymentStatus.CANCELLED ? intent.getUpdatedAt().toEpochMilli() : 0);
        result.put("transaction", intent.getId().toString());
        result.put("state", state);
        result.put("reason", null);
        return Map.of("jsonrpc", "2.0", "id", id, "result", result);
    }

    @SuppressWarnings("unchecked")
    private BillingPaymentIntent resolvePaymeIntent(Map<String, Object> params) {
        Object accountObj = params.get("account");
        if (!(accountObj instanceof Map<?, ?> account)) {
            return null;
        }
        Object orderId = account.get("order_id");
        if (orderId == null) {
            orderId = account.get("orderId");
        }
        UUID id = parseUuid(String.valueOf(orderId));
        if (id == null) {
            return null;
        }
        return intentRepository.findById(id)
            .filter(i -> i.getProvider() == BillingPaymentProvider.PAYME)
            .orElse(null);
    }

    private void markPaid(BillingPaymentIntent intent, String providerTransId, String description) {
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return;
        }
        CompanyBilling billing = accountService.requireOrCreateBilling(intent.getCompanyId());
        ledgerService.record(billing, intent.getAmount(), BillingLedgerType.TOP_UP, description);
        accountService.refreshAccessStatus(billing, Instant.now());
        companyBillingRepository.save(billing);

        intent.setStatus(BillingPaymentStatus.PAID);
        intent.setProviderTransId(providerTransId);
        intent.setPaidAt(Instant.now());
        intentRepository.save(intent);
    }

    private String buildClickUrl(UUID intentId, BigDecimal amount) {
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

    private String buildPaymeUrl(UUID intentId, BigDecimal amount) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("m", props.getPayme().getMerchantId());
        payload.put("ac", Map.of("order_id", intentId.toString()));
        payload.put("a", toTiyin(amount));
        payload.put("c", props.getReturnUrl());
        String json = toSimpleJson(payload);
        String encoded = Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
        return props.getPayme().getCheckoutUrl() + "/" + encoded;
    }

    private boolean verifyClickSign(Map<String, String> params, boolean complete) {
        String clickTransId = str(params.get("click_trans_id"));
        String serviceId = str(params.get("service_id"));
        String secret = props.getClick().getSecretKey();
        String merchantTransId = str(params.get("merchant_trans_id"));
        String amount = str(params.get("amount"));
        String action = str(params.get("action"));
        String signTime = str(params.get("sign_time"));
        String provided = str(params.get("sign_string"));

        String raw;
        if (complete) {
            String prepareId = str(params.get("merchant_prepare_id"));
            raw = clickTransId + serviceId + secret + merchantTransId + prepareId + amount + action + signTime;
        } else {
            raw = clickTransId + serviceId + secret + merchantTransId + amount + action + signTime;
        }
        return ClickSignature.matches(ClickSignature.md5(raw), provided);
    }

    private boolean verifyPaymeAuth(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Basic ")) {
            return false;
        }
        try {
            String decoded = new String(Base64.getDecoder().decode(authHeader.substring(6)), StandardCharsets.UTF_8);
            // merchantId:key  OR  :key
            int idx = decoded.indexOf(':');
            String key = idx >= 0 ? decoded.substring(idx + 1) : decoded;
            return props.getPayme().getSecretKey().equals(key)
                || decoded.equals(props.getPayme().getMerchantId() + ":" + props.getPayme().getSecretKey());
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isClickConfigured() {
        var c = props.getClick();
        return c.isEnabled()
            && notBlank(c.getMerchantId())
            && notBlank(c.getServiceId())
            && notBlank(c.getSecretKey());
    }

    private boolean isPaymeConfigured() {
        var p = props.getPayme();
        return p.isEnabled()
            && notBlank(p.getMerchantId())
            && notBlank(p.getSecretKey());
    }

    private static Map<String, Object> clickError(Map<String, String> params, int code, String note) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("click_trans_id", params.get("click_trans_id"));
        m.put("merchant_trans_id", params.get("merchant_trans_id"));
        m.put("error", code);
        m.put("error_note", note);
        return m;
    }

    private static Map<String, Object> paymeError(Object id, int code, String message) {
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("code", code);
        error.put("message", Map.of("ru", message, "uz", message, "en", message));
        error.put("data", null);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("jsonrpc", "2.0");
        resp.put("id", id instanceof Map ? ((Map<?, ?>) id).get("id") : id);
        if (id instanceof Map<?, ?> body && body.containsKey("id")) {
            resp.put("id", body.get("id"));
        }
        resp.put("error", error);
        return resp;
    }

    private static Map<String, Object> paymeError(Map<String, Object> body, int code, String message) {
        return paymeError(body != null ? body.get("id") : null, code, message);
    }

    private static UUID parseUuid(String raw) {
        if (raw == null || raw.isBlank() || "null".equals(raw)) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private static BigDecimal parseDecimal(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(raw.trim()).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            return null;
        }
    }

    private static BigDecimal toDecimal(Object raw) {
        if (raw == null) {
            return null;
        }
        try {
            return new BigDecimal(String.valueOf(raw));
        } catch (Exception e) {
            return null;
        }
    }

    private static long toTiyin(BigDecimal amountUzs) {
        return amountUzs.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    private static int parseInt(String raw, int def) {
        try {
            return Integer.parseInt(raw);
        } catch (Exception e) {
            return def;
        }
    }

    private static String str(String v) {
        return v == null ? "" : v;
    }

    private static boolean notBlank(String v) {
        return v != null && !v.isBlank();
    }

    private static String toSimpleJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : map.entrySet()) {
            if (!first) {
                sb.append(',');
            }
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
        sb.append('}');
        return sb.toString();
    }
}
