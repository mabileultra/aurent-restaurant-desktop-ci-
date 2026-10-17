package com.pos.shared.jwt;

/**
 * Имена JWT claims, общие для всех сервисов.
 */
public final class JwtClaimNames {

    public static final String COMPANY_ID = "company_id";
    public static final String ROLES = "roles";
    /** True when this login may press «Выдать счёт». Absent on older tokens. */
    public static final String CAN_REQUEST_BILL = "can_request_bill";

    private JwtClaimNames() {
    }
}
