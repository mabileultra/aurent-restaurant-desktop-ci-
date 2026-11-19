package com.pos.shared.payment;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Правила совпадают с кассой (packages/shared-fiscal/src/cardDetails.js). Неверное поле обнуляется,
 * остальные сохраняются: продажа к этому моменту уже пробита в ФМ, её нельзя терять.
 */
class CardDetailsRulesTest {

    private static final String MASK = "8600********1234";
    private static final String RRN = "123456789012";

    @Test
    void cardPaymentWithSocialCardKeepsNormalizedDetails() {
        CardDetailsCheck check = CardDetailsRules.check(" social ", "1234 5678-9012", MASK, true);

        assertTrue(check.ok());
        assertEquals(new CardDetails(CardCategory.SOCIAL, RRN, MASK), check.details());
    }

    @Test
    void missingOrBlankFieldsGiveEmptyDetailsForAnyPayment() {
        assertEquals(new CardDetailsCheck(CardDetails.EMPTY, Set.of()), CardDetailsRules.check(null, null, null, false));
        assertEquals(new CardDetailsCheck(CardDetails.EMPTY, Set.of()), CardDetailsRules.check(" ", "", null, true));
    }

    @Test
    void eachFieldIsOptionalOnCardPayment() {
        assertEquals(new CardDetails(null, RRN, null), CardDetailsRules.check(null, RRN, null, true).details());
        assertEquals(new CardDetails(CardCategory.CORPORATE, null, null),
            CardDetailsRules.check("corporate", null, null, true).details());
    }

    @Test
    void badRrnIsDroppedAndCategoryKept() {
        for (String rrn : new String[] {"12345678901", "1234567890123", "12345678901A", "1234*6789012"}) {
            CardDetailsCheck check = CardDetailsRules.check("PERSONAL", rrn, null, true);

            assertEquals(Set.of(CardDetailsViolation.RRN_FORMAT), check.violations(), rrn);
            assertEquals(new CardDetails(CardCategory.PERSONAL, null, null), check.details(), rrn);
        }
    }

    @Test
    void unknownCategoryIsDroppedAndRrnKept() {
        CardDetailsCheck check = CardDetailsRules.check("GOLD", RRN, null, true);

        assertEquals(Set.of(CardDetailsViolation.CATEGORY_UNKNOWN), check.violations());
        assertEquals(new CardDetails(null, RRN, null), check.details());
    }

    @Test
    void fullSocialCardNumberIsFlaggedDroppedAndNeverEchoed() {
        for (String number : new String[] {"8600555566661234", "8600 5555 6666 1234", "8600-5555-6666-1234"}) {
            CardDetailsCheck check = CardDetailsRules.check("SOCIAL", RRN, number, true);

            assertTrue(check.has(CardDetailsViolation.SOCIAL_NUMBER_UNMASKED), number);
            assertEquals(new CardDetails(CardCategory.SOCIAL, RRN, null), check.details(), number);
            assertFalse(check.toString().contains("55556666"), number);
            assertFalse(CardDetailsViolation.SOCIAL_NUMBER_UNMASKED.message().contains("8600"), number);
        }
    }

    @Test
    void fullSocialCardNumberIsFlaggedEvenWithoutCardPayment() {
        CardDetailsCheck check = CardDetailsRules.check("SOCIAL", RRN, "8600123456781234", false);

        assertTrue(check.has(CardDetailsViolation.SOCIAL_NUMBER_UNMASKED));
        assertEquals(CardDetails.EMPTY, check.details());
    }

    @Test
    void badSocialMaskIsDropped() {
        for (String number : new String[] {"8600****1234", "8600*******1234", "860A********1234", "1234"}) {
            CardDetailsCheck check = CardDetailsRules.check("SOCIAL", RRN, number, true);

            assertEquals(Set.of(CardDetailsViolation.SOCIAL_NUMBER_FORMAT), check.violations(), number);
            assertEquals(new CardDetails(CardCategory.SOCIAL, RRN, null), check.details(), number);
        }
    }

    @Test
    void socialCardNumberIsDroppedForNonSocialCategory() {
        CardDetailsCheck personal = CardDetailsRules.check("PERSONAL", RRN, MASK, true);
        CardDetailsCheck noCategory = CardDetailsRules.check(null, RRN, MASK, true);

        assertEquals(Set.of(CardDetailsViolation.SOCIAL_NUMBER_NOT_SOCIAL), personal.violations());
        assertEquals(new CardDetails(CardCategory.PERSONAL, RRN, null), personal.details());
        assertEquals(new CardDetails(null, RRN, null), noCategory.details());
    }

    @Test
    void socialCategoryWithoutNumberIsAllowed() {
        assertEquals(new CardDetailsCheck(new CardDetails(CardCategory.SOCIAL, RRN, null), Set.of()),
            CardDetailsRules.check("SOCIAL", RRN, null, true));
    }

    @Test
    void cardFieldsWithoutCardPaymentAreAllDropped() {
        CardDetailsCheck check = CardDetailsRules.check("PERSONAL", RRN, null, false);

        assertEquals(Set.of(CardDetailsViolation.NOT_CARD_PAYMENT), check.violations());
        assertEquals(CardDetails.EMPTY, check.details());
    }
}
