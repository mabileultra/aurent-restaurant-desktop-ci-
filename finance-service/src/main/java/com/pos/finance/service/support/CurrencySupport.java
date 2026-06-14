package com.pos.finance.service.support;

import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.exception.FinanceExceptions;

import java.util.Set;

public final class CurrencySupport {

    public static final String DEFAULT_CURRENCY = "UZS";

    private static final Set<String> ALLOWED = Set.of("UZS", "USD", "EUR", "RUB");

    private CurrencySupport() {
    }

    public static String resolve(String currency) {
        String normalized = normalize(currency);
        if (!ALLOWED.contains(normalized)) {
            throw FinanceExceptions.badRequest("Недопустимая валюта: " + currency);
        }
        return normalized;
    }

    public static void requireMatchesAccount(String currency, FinancialAccount account) {
        String operationCurrency = resolve(currency);
        String accountCurrency = account.getCurrency() != null ? account.getCurrency() : DEFAULT_CURRENCY;
        if (!operationCurrency.equals(accountCurrency)) {
            throw FinanceExceptions.badRequest(
                "Валюта операции (" + operationCurrency + ") не совпадает с валютой счёта ("
                    + accountCurrency + ")"
            );
        }
    }

    private static String normalize(String currency) {
        if (currency == null || currency.isBlank()) {
            return DEFAULT_CURRENCY;
        }
        return currency.trim().toUpperCase();
    }
}
