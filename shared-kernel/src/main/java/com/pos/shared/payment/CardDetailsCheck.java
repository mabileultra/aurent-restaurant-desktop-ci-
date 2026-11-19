package com.pos.shared.payment;

import java.util.Set;

/**
 * Результат проверки реквизитов карты: очищенные данные (неверные поля обнулены) и список нарушений.
 * Ни одно поле не содержит отброшенных значений.
 */
public record CardDetailsCheck(CardDetails details, Set<CardDetailsViolation> violations) {

    public CardDetailsCheck {
        violations = Set.copyOf(violations);
    }

    public boolean ok() {
        return violations.isEmpty();
    }

    public boolean has(CardDetailsViolation violation) {
        return violations.contains(violation);
    }
}
