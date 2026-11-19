package com.pos.shared.payment;

import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Общие правила реквизитов оплаты картой (категория, RRN, маска соцкарты) для всех сервисов продаж.
 * <p>
 * Правила совпадают с кассой ({@code packages/shared-fiscal/src/cardDetails.js}): RRN — 12 цифр
 * после удаления пробелов и дефисов, номер соцкарты — только маска {@code 8600********1234}.
 * <p>
 * Касса отправляет продажу уже после пробития чека, поэтому правила не отклоняют её целиком:
 * неверное поле обнуляется, остальные сохраняются, а нарушение попадает в {@link CardDetailsCheck#violations()}.
 * Что делать с нарушением (WARN или 400), решает сервис. Введённые значения не попадают ни в результат,
 * ни в текст нарушения.
 */
public final class CardDetailsRules {

    private static final Pattern SEPARATORS = Pattern.compile("[\\s-]+");
    private static final Pattern RRN = Pattern.compile("\\d{12}");
    private static final Pattern SOCIAL_MASK = Pattern.compile("\\d{4}\\*{8}\\d{4}");
    private static final Pattern DIGITS_ONLY = Pattern.compile("\\d+");
    private static final int MIN_FULL_NUMBER_DIGITS = 12;

    private CardDetailsRules() {}

    /**
     * Проверяет и очищает реквизиты карты.
     *
     * @param cardPaid оплачена ли продажа картой (полностью или частично); решает сервис
     */
    public static CardDetailsCheck check(String rawCategory, String rawRrn, String rawSocialNumber, boolean cardPaid) {
        String categoryText = blankToNull(rawCategory);
        String rrnText = blankToNull(rawRrn);
        String socialText = blankToNull(rawSocialNumber);
        if (categoryText == null && rrnText == null && socialText == null) {
            return new CardDetailsCheck(CardDetails.EMPTY, Set.of());
        }
        Set<CardDetailsViolation> violations = EnumSet.noneOf(CardDetailsViolation.class);
        CardCategory category = categoryText == null ? null : parseCategory(categoryText);
        if (categoryText != null && category == null) {
            violations.add(CardDetailsViolation.CATEGORY_UNKNOWN);
        }
        String rrn = rrnText == null ? null : stripSeparators(rrnText);
        if (rrn != null && !RRN.matcher(rrn).matches()) {
            violations.add(CardDetailsViolation.RRN_FORMAT);
            rrn = null;
        }
        String socialNumber = null;
        if (socialText != null) {
            CardDetailsViolation violation = socialNumberViolation(socialText, category);
            if (violation == null) {
                socialNumber = stripSeparators(socialText);
            } else {
                violations.add(violation);
            }
        }
        if (!cardPaid) {
            violations.add(CardDetailsViolation.NOT_CARD_PAYMENT);
            return new CardDetailsCheck(CardDetails.EMPTY, violations);
        }
        return new CardDetailsCheck(new CardDetails(category, rrn, socialNumber), violations);
    }

    private static CardDetailsViolation socialNumberViolation(String text, CardCategory category) {
        String compact = stripSeparators(text);
        if (DIGITS_ONLY.matcher(compact).matches() && compact.length() >= MIN_FULL_NUMBER_DIGITS) {
            return CardDetailsViolation.SOCIAL_NUMBER_UNMASKED;
        }
        if (!SOCIAL_MASK.matcher(compact).matches()) {
            return CardDetailsViolation.SOCIAL_NUMBER_FORMAT;
        }
        if (category != CardCategory.SOCIAL) {
            return CardDetailsViolation.SOCIAL_NUMBER_NOT_SOCIAL;
        }
        return null;
    }

    private static CardCategory parseCategory(String text) {
        String key = text.toUpperCase(Locale.ROOT);
        for (CardCategory category : CardCategory.values()) {
            if (category.name().equals(key)) {
                return category;
            }
        }
        return null;
    }

    private static String stripSeparators(String text) {
        return SEPARATORS.matcher(text).replaceAll("");
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
