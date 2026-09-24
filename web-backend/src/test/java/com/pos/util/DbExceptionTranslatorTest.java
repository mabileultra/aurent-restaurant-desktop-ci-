package com.pos.util;

import com.pos.exception.BadRequestException;
import com.pos.exception.ConflictException;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DbExceptionTranslatorTest {

    @Test
    void persist_rethrowsBusinessExceptions() {
        BadRequestException ex = new BadRequestException("bad");

        BadRequestException thrown = assertThrows(BadRequestException.class,
            () -> DbExceptionTranslator.persist(() -> { throw ex; }));

        assertEquals("bad", thrown.getMessage());
    }

    @Test
    void persist_mapsDataAccessToClientException() {
        RuntimeException thrown = assertThrows(RuntimeException.class,
            () -> DbExceptionTranslator.persist(() -> {
                throw new DataIntegrityViolationException("duplicate key uq_users_company_email");
            }));

        assertInstanceOf(ConflictException.class, thrown);
    }

    @Test
    void clientMessage_mapsPinDigestUniqueConstraintNotSchemaStale() {
        String message = DbExceptionTranslator.clientMessage(
            new DataIntegrityViolationException(
                "ERROR: duplicate key value violates unique constraint \"uq_users_company_pin_digest\"\n"
                    + "Detail: Key (company_id, pin_digest)=(41, abc) already exists."
            )
        );

        assertEquals("Такой PIN уже используется в компании", message);
    }
}
