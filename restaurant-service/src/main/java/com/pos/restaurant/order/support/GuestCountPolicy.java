package com.pos.restaurant.order.support;

import com.pos.restaurant.exception.ValidationException;
import org.springframework.stereotype.Component;

@Component
public class GuestCountPolicy {

    public GuestCounts normalize(Integer guestCount, Integer adultCount, Integer childrenCount) {
        if (guestCount == null || guestCount < 1) {
            throw new ValidationException("Guest count must be at least 1");
        }
        int adults = adultCount == null ? guestCount : adultCount;
        int children = childrenCount == null ? 0 : childrenCount;
        if (adults < 0 || children < 0) {
            throw new ValidationException("Adult and children counts cannot be negative");
        }
        if (adults + children != guestCount) {
            if (adultCount == null && childrenCount == null) {
                adults = guestCount;
                children = 0;
            } else {
                throw new ValidationException("Adults + children must equal guest count");
            }
        }
        return new GuestCounts(guestCount, adults, children);
    }
}
