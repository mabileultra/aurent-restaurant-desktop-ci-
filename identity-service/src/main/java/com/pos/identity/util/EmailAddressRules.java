package com.pos.identity.util;

import com.pos.identity.exception.IdentityExceptions;

public final class EmailAddressRules {

    public static final String PATTERN =
        "^[A-Za-z0-9_%+-]+(?:\\.[A-Za-z0-9_%+-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\\.[A-Za-z]{2,24}$";

    public static final String MESSAGE = "Invalid email";

    private static final int MAX_LENGTH = 254;
    private static final int MAX_LOCAL_PART = 64;
    private static final java.util.regex.Pattern COMPILED = java.util.regex.Pattern.compile(PATTERN);

    private EmailAddressRules() {
    }

    public static String require(String raw) {
        String email = UserLoginUtil.normalizeEmail(raw);
        if (!isValid(email)) {
            throw IdentityExceptions.badRequest(MESSAGE);
        }
        return email;
    }

    public static boolean isValid(String email) {
        if (email == null || email.length() > MAX_LENGTH) {
            return false;
        }
        int at = email.indexOf('@');
        if (at <= 0 || at > MAX_LOCAL_PART) {
            return false;
        }
        return COMPILED.matcher(email).matches();
    }
}
