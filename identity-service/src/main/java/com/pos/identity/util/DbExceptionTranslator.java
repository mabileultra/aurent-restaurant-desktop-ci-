package com.pos.identity.util;

import com.pos.identity.exception.BadRequestException;
import com.pos.identity.exception.ConflictException;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.function.Supplier;

public final class DbExceptionTranslator {

    private DbExceptionTranslator() {
    }

    public static <T> T persist(Supplier<T> action) {
        try {
            return action.get();
        } catch (BadRequestException | ConflictException ex) {
            throw ex;
        } catch (DataAccessException ex) {
            throw toClientException(ex);
        }
    }

    public static RuntimeException toClientException(Throwable ex) {
        String message = clientMessage(ex);
        if (message.contains("уже занят")
            || message.contains("уже зарегистрирован")
            || message.contains("уже существует")
            || message.contains("PIN уже")) {
            return new ConflictException(message);
        }
        return new BadRequestException(message);
    }

    private static String clientMessage(Throwable ex) {
        String root = rootCauseMessage(ex);
        String lower = root.toLowerCase();

        if (lower.contains("uq_users_tenant_username")
            || (lower.contains("duplicate key") && lower.contains("username"))) {
            return "Логин уже занят (такой username уже есть в системе)";
        }
        if (lower.contains("uq_users_company_email")
            || (lower.contains("duplicate key") && lower.contains("email"))) {
            return "Email уже зарегистрирован в этой компании";
        }
        if (lower.contains("uq_users_company_pin_digest")) {
            return "Такой PIN уже используется в компании";
        }
        if (lower.contains("duplicate key") || lower.contains("unique constraint")) {
            return "Пользователь с такими данными уже существует";
        }
        return "Ошибка БД: " + root;
    }

    private static String rootCauseMessage(Throwable ex) {
        Throwable cause = ex;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        return cause.getMessage() != null ? cause.getMessage() : cause.getClass().getSimpleName();
    }
}
