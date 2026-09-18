package com.pos.sales.support;

import com.pos.sales.entity.CashRegister;
import org.springframework.stereotype.Component;

@Component
public class CashRegisterStatusToggle {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";

    public String apply(CashRegister register) {
        String next = STATUS_ACTIVE.equalsIgnoreCase(register.getStatus())
            ? STATUS_INACTIVE
            : STATUS_ACTIVE;
        register.setStatus(next);
        if (STATUS_INACTIVE.equals(next)) {
            register.setDeviceId(null);
        }
        return next;
    }
}
