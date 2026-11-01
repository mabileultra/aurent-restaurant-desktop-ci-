package com.pos.inventory.service.support;

import com.pos.exception.BadRequestException;
import com.pos.inventory.entity.Supplier;
import org.springframework.util.StringUtils;

import java.util.regex.Pattern;

public final class SupplierMutationSupport {

    /** Узбекский расчётный счёт: ровно 20 цифр. */
    private static final Pattern ACCOUNT_OK = Pattern.compile("^\\d{20}$");
    private static final Pattern PHONE_DIGITS = Pattern.compile("\\D+");

    private SupplierMutationSupport() {}

    public static String normalizeAccountNumber(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "";
        }
        return raw.replaceAll("\\D", "");
    }

    public static void validateAccountNumber(String accountNumber) {
        String digits = normalizeAccountNumber(accountNumber);
        if (!ACCOUNT_OK.matcher(digits).matches()) {
            throw new BadRequestException("Ҳисоб рақам должен содержать 20 цифр");
        }
    }

    public static void validatePhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            throw new BadRequestException("Номер телефона обязателен");
        }
        String digits = PHONE_DIGITS.matcher(phone).replaceAll("");
        if (digits.startsWith("998")) {
            digits = digits.substring(3);
        }
        if (digits.length() != 9) {
            throw new BadRequestException("Некорректный номер телефона");
        }
    }

    public static void applyFields(
        Supplier supplier,
        String name,
        String taxId,
        String accountNumber,
        String phone
    ) {
        validateAccountNumber(accountNumber);
        validatePhone(phone);
        supplier.setName(name.trim());
        supplier.setTaxId(taxId.trim());
        supplier.setAccountNumber(normalizeAccountNumber(accountNumber));
        supplier.setPhone(phone.trim());
        supplier.setAddress(null);
        supplier.setEmail(null);
    }
}
