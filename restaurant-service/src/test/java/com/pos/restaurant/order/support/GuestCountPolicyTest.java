package com.pos.restaurant.order.support;

import com.pos.restaurant.exception.ValidationException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GuestCountPolicyTest {

    private final GuestCountPolicy policy = new GuestCountPolicy();

    @Test
    void defaultsAdultsToGuestCount() {
        GuestCounts counts = policy.normalize(4, null, null);
        assertEquals(4, counts.guestCount());
        assertEquals(4, counts.adultCount());
        assertEquals(0, counts.childrenCount());
    }

    @Test
    void acceptsSplitGuests() {
        GuestCounts counts = policy.normalize(5, 3, 2);
        assertEquals(3, counts.adultCount());
        assertEquals(2, counts.childrenCount());
    }

    @Test
    void rejectsMismatchedSplit() {
        assertThrows(ValidationException.class, () -> policy.normalize(5, 3, 1));
    }
}
