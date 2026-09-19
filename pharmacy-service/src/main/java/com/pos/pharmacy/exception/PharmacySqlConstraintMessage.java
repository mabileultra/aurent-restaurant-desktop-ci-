package com.pos.pharmacy.exception;

import com.pos.pharmacy.exception.errorcode.PharmacySqlConstraintError;

/** Человекочитаемые тексты вместо SQL из PostgreSQL/Hibernate. */
public final class PharmacySqlConstraintMessage {

    private PharmacySqlConstraintMessage() {}

    public static String of(Throwable error) {
        return PharmacySqlConstraintError.of(error).message();
    }
}
