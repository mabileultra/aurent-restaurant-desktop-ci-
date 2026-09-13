package com.pos.platform.service.impl;

import com.pos.platform.config.BillingPaymentProperties;
import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.entity.BillingPaymentIntent;
import com.pos.platform.repository.BillingPaymentIntentRepository;
import com.pos.platform.service.BillingPaymentCreditService;
import com.pos.platform.service.PaymeBillingCallbackService;
import com.pos.platform.service.support.BillingPaymentAuth;
import com.pos.platform.service.support.BillingPaymentUrlBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymeBillingCallbackServiceImpl implements PaymeBillingCallbackService {

    private static final int STATE_CREATED = 1;
    private static final int STATE_DONE = 2;
    private static final int STATE_CANCELLED = -1;
    private static final int STATE_CANCELLED_AFTER = -2;

    private final BillingPaymentIntentRepository intentRepository;
    private final BillingPaymentCreditService creditService;
    private final BillingPaymentAuth auth;
    private final BillingPaymentProperties paymentProperties;

    @Override
    @Transactional
    public Object handle(Map<String, Object> body, String authHeader) {
        if (!auth.paymeConfigured()) {
            return error(body != null ? body.get("id") : null, -32400, "Payme disabled");
        }
        if (!auth.verifyPaymeAuth(authHeader)) {
            return error(body != null ? body.get("id") : null, -32504, "Insufficient privilege");
        }

        String method = String.valueOf(body.get("method"));
        Object id = body.get("id");
        @SuppressWarnings("unchecked")
        Map<String, Object> params = body.get("params") instanceof Map<?, ?> m
            ? (Map<String, Object>) m
            : Map.of();

        return switch (method) {
            case "CheckPerformTransaction" -> checkPerform(id, params);
            case "CreateTransaction" -> create(id, params);
            case "PerformTransaction" -> perform(id, params);
            case "CancelTransaction" -> cancel(id, params);
            case "CheckTransaction" -> check(id, params);
            case "GetStatement" -> getStatement(id, params);
            default -> error(id, -32601, "Method not found");
        };
    }

    private Map<String, Object> checkPerform(Object id, Map<String, Object> params) {
        BillingPaymentIntent intent = resolveIntent(params);
        if (intent == null) {
            return error(id, -31050, "Order not found");
        }
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return error(id, -31051, "Already paid");
        }
        BigDecimal amountTiyin = toDecimal(params.get("amount"));
        long expected = BillingPaymentUrlBuilder.toTiyin(intent.getAmount());
        if (amountTiyin == null || amountTiyin.longValue() != expected) {
            return error(id, -31001, "Invalid amount");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("allow", true);
        result.put("detail", buildFiscalDetail(expected));
        return ok(id, result);
    }

    private Map<String, Object> buildFiscalDetail(long amountTiyin) {
        BillingPaymentProperties.Payme payme = paymentProperties.getPayme();
        String title = StringUtils.hasText(payme.getReceiptTitle())
            ? payme.getReceiptTitle().trim()
            : "Пополнение баланса Aurent";
        String ikpu = StringUtils.hasText(payme.getIkpu()) ? payme.getIkpu().trim() : "10305008003000000";
        String packageCode = StringUtils.hasText(payme.getPackageCode())
            ? payme.getPackageCode().trim()
            : "1546532";
        int vat = payme.getVatPercent();

        Map<String, Object> item = new LinkedHashMap<>();
        item.put("title", title);
        item.put("price", amountTiyin);
        item.put("count", 1);
        item.put("code", ikpu);
        item.put("package_code", packageCode);
        item.put("vat_percent", vat);

        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("receipt_type", 0);
        detail.put("items", List.of(item));
        return detail;
    }

    private Map<String, Object> create(Object id, Map<String, Object> params) {
        BillingPaymentIntent intent = resolveIntent(params);
        if (intent == null) {
            return error(id, -31050, "Order not found");
        }
        BigDecimal amountTiyin = toDecimal(params.get("amount"));
        if (amountTiyin == null || amountTiyin.longValue() != BillingPaymentUrlBuilder.toTiyin(intent.getAmount())) {
            return error(id, -31001, "Invalid amount");
        }
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return error(id, -31051, "Already paid");
        }
        String paymeId = String.valueOf(params.get("id"));
        if (intent.getStatus() == BillingPaymentStatus.PREPARED
            && paymeId.equals(intent.getProviderTransId())) {
            return ok(id, Map.of(
                "create_time", intent.getCreatedAt().toEpochMilli(),
                "transaction", intent.getId().toString(),
                "state", STATE_CREATED
            ));
        }
        intent.setProviderTransId(paymeId);
        intent.setStatus(BillingPaymentStatus.PREPARED);
        intent.setProviderPrepareId(String.valueOf(intent.getCreatedAt().toEpochMilli()));
        intentRepository.save(intent);
        return ok(id, Map.of(
            "create_time", intent.getCreatedAt().toEpochMilli(),
            "transaction", intent.getId().toString(),
            "state", STATE_CREATED
        ));
    }

    private Map<String, Object> perform(Object id, Map<String, Object> params) {
        BillingPaymentIntent intent = findByPaymeId(String.valueOf(params.get("id")));
        if (intent == null) {
            return error(id, -31003, "Transaction not found");
        }
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return ok(id, Map.of(
                "transaction", intent.getId().toString(),
                "perform_time", intent.getPaidAt() != null
                    ? intent.getPaidAt().toEpochMilli()
                    : Instant.now().toEpochMilli(),
                "state", STATE_DONE
            ));
        }
        if (intent.getStatus() == BillingPaymentStatus.CANCELLED
            || intent.getStatus() == BillingPaymentStatus.FAILED) {
            return error(id, -31008, "Transaction cancelled");
        }
        String paymeId = String.valueOf(params.get("id"));
        creditService.markPaid(intent, paymeId, "Пополнение через Payme");
        BillingPaymentIntent paid = intentRepository.findById(intent.getId()).orElse(intent);
        return ok(id, Map.of(
            "transaction", paid.getId().toString(),
            "perform_time", paid.getPaidAt() != null
                ? paid.getPaidAt().toEpochMilli()
                : Instant.now().toEpochMilli(),
            "state", STATE_DONE
        ));
    }

    private Map<String, Object> cancel(Object id, Map<String, Object> params) {
        BillingPaymentIntent intent = findByPaymeId(String.valueOf(params.get("id")));
        if (intent == null) {
            return error(id, -31003, "Transaction not found");
        }
        boolean afterPay = intent.getStatus() == BillingPaymentStatus.PAID;
        if (afterPay) {
            creditService.reversePaid(intent, "Payme CancelTransaction after Perform");
        } else {
            intent.setStatus(BillingPaymentStatus.CANCELLED);
            intentRepository.save(intent);
        }
        Instant cancelAt = Instant.now();
        return ok(id, Map.of(
            "transaction", intent.getId().toString(),
            "cancel_time", cancelAt.toEpochMilli(),
            "state", afterPay ? STATE_CANCELLED_AFTER : STATE_CANCELLED
        ));
    }

    private Map<String, Object> check(Object id, Map<String, Object> params) {
        BillingPaymentIntent intent = findByPaymeId(String.valueOf(params.get("id")));
        if (intent == null) {
            return error(id, -31003, "Transaction not found");
        }
        int state = switch (intent.getStatus()) {
            case PAID -> STATE_DONE;
            case CANCELLED -> intent.getPaidAt() != null ? STATE_CANCELLED_AFTER : STATE_CANCELLED;
            case FAILED -> STATE_CANCELLED;
            default -> STATE_CREATED;
        };
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("create_time", intent.getCreatedAt().toEpochMilli());
        result.put("perform_time", intent.getPaidAt() != null ? intent.getPaidAt().toEpochMilli() : 0L);
        result.put(
            "cancel_time",
            intent.getStatus() == BillingPaymentStatus.CANCELLED ? intent.getUpdatedAt().toEpochMilli() : 0L
        );
        result.put("transaction", intent.getId().toString());
        result.put("state", state);
        result.put("reason", null);
        return ok(id, result);
    }

    private Map<String, Object> getStatement(Object id, Map<String, Object> params) {
        Instant from = millisToInstant(params.get("from"));
        Instant to = millisToInstant(params.get("to"));
        if (from == null || to == null) {
            return error(id, -31050, "Invalid period");
        }
        List<BillingPaymentIntent> rows = intentRepository.findPaymeStatement(
            BillingPaymentProvider.PAYME,
            from,
            to
        );
        List<Map<String, Object>> transactions = new ArrayList<>();
        for (BillingPaymentIntent intent : rows) {
            if (intent.getProviderTransId() == null || intent.getProviderTransId().isBlank()) {
                continue;
            }
            int state = switch (intent.getStatus()) {
                case PAID -> STATE_DONE;
                case CANCELLED -> intent.getPaidAt() != null ? STATE_CANCELLED_AFTER : STATE_CANCELLED;
                case FAILED -> STATE_CANCELLED;
                default -> STATE_CREATED;
            };
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", intent.getProviderTransId());
            row.put("time", intent.getCreatedAt().toEpochMilli());
            row.put("amount", BillingPaymentUrlBuilder.toTiyin(intent.getAmount()));
            row.put("account", Map.of("order_id", intent.getId().toString()));
            row.put("create_time", intent.getCreatedAt().toEpochMilli());
            row.put("perform_time", intent.getPaidAt() != null ? intent.getPaidAt().toEpochMilli() : 0L);
            row.put(
                "cancel_time",
                intent.getStatus() == BillingPaymentStatus.CANCELLED
                    ? intent.getUpdatedAt().toEpochMilli()
                    : 0L
            );
            row.put("transaction", intent.getId().toString());
            row.put("state", state);
            row.put("reason", null);
            transactions.add(row);
        }
        return ok(id, Map.of("transactions", transactions));
    }

    private BillingPaymentIntent findByPaymeId(String paymeId) {
        return intentRepository
            .findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, paymeId)
            .orElseGet(() -> {
                UUID maybe = parseUuid(paymeId);
                return maybe == null ? null : intentRepository.findById(maybe).orElse(null);
            });
    }

    private BillingPaymentIntent resolveIntent(Map<String, Object> params) {
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

    private static Map<String, Object> ok(Object id, Map<String, Object> result) {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("jsonrpc", "2.0");
        resp.put("id", id);
        resp.put("result", result);
        return resp;
    }

    private static Map<String, Object> error(Object id, int code, String message) {
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("code", code);
        error.put("message", Map.of("ru", message, "uz", message, "en", message));
        error.put("data", null);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("jsonrpc", "2.0");
        resp.put("id", id);
        resp.put("error", error);
        return resp;
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

    private static Instant millisToInstant(Object raw) {
        if (raw == null) {
            return null;
        }
        try {
            long ms = Long.parseLong(String.valueOf(raw).trim());
            return Instant.ofEpochMilli(ms);
        } catch (Exception e) {
            return null;
        }
    }
}
