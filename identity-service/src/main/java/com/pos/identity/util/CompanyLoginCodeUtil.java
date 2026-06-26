package com.pos.identity.util;

import com.pos.identity.exception.BadRequestException;
import org.springframework.util.StringUtils;

import java.util.concurrent.ThreadLocalRandom;

public final class CompanyLoginCodeUtil {

    public static final int MIN_CODE = 10_000;
    public static final int MAX_CODE = 99_999;

    private CompanyLoginCodeUtil() {
    }

    public static String normalize(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "";
        }
        String digits = raw.trim().replaceAll("\\D", "");
        if (!StringUtils.hasText(digits)) {
            return "";
        }
        int value;
        try {
            value = Integer.parseInt(digits);
        } catch (NumberFormatException ex) {
            throw invalidFormat();
        }
        return format(value);
    }

    public static String format(int code) {
        if (!isValidValue(code)) {
            throw invalidFormat();
        }
        return String.format("%05d", code);
    }

    public static boolean isValidValue(int code) {
        return code >= MIN_CODE && code <= MAX_CODE;
    }

    public static int randomValue() {
        int span = MAX_CODE - MIN_CODE + 1;
        return MIN_CODE + ThreadLocalRandom.current().nextInt(span);
    }

    public static BadRequestException invalidFormat() {
        return new BadRequestException(
            "Код входа: 5 цифр, от " + MIN_CODE + " до " + MAX_CODE
        );
    }
}
