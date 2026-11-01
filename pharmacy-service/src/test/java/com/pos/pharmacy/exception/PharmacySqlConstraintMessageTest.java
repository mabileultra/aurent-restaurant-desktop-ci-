package com.pos.pharmacy.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacySqlConstraintMessageTest {

    @Test
    void explainsReceiptLineLotFk() {
        RuntimeException error = new RuntimeException(
            "violates foreign key constraint \"fk_stock_lots_receipt_line\""
        );
        String message = PharmacySqlConstraintMessage.of(error);
        assertTrue(message.contains("парти"));
        assertTrue(message.toLowerCase().contains("удал") || message.contains("строк"));
    }

    @Test
    void explainsMarkKeyLength() {
        RuntimeException error = new RuntimeException(
            "ERROR: value too long for type character varying(190)"
        );
        assertEquals(
            "Код маркировки слишком длинный. Повторите проведение документа.",
            PharmacySqlConstraintMessage.of(error)
        );
    }

    @Test
    void explainsDuplicateMarkKey() {
        RuntimeException error = new RuntimeException(
            "duplicate key value violates unique constraint \"uk_pharm_stock_marks_company_key\""
        );
        assertEquals(
            "Код маркировки уже на складе или продан",
            PharmacySqlConstraintMessage.of(error)
        );
    }

    @Test
    void explainsDuplicateReceiptNumber() {
        RuntimeException error = new RuntimeException(
            "duplicate key value violates unique constraint \"stock_receipts_receipt_number_key\""
                + " Detail: Key (receipt_number)=(REC-20260919-0002) already exists."
        );
        assertEquals(
            "Номер прихода уже занят. Обновите страницу и создайте документ ещё раз.",
            PharmacySqlConstraintMessage.of(error)
        );
    }

    @Test
    void explainsNumericOverflowAsAmountTooLarge() {
        RuntimeException error = new RuntimeException(
            "ERROR: numeric field overflow Detail: A field with precision 8, scale 2 must round to an absolute value less than 10^6."
        );
        assertEquals(
            "Сумма слишком большая. В цену или количество попал ИКПУ или штрихкод.",
            PharmacySqlConstraintMessage.of(error)
        );
    }

    @Test
    void explainsValueTooLong() {
        RuntimeException error = new RuntimeException(
            "ERROR: value too long for type character varying(20)"
        );
        assertEquals(
            "Слишком длинное значение (серия, штрихкод, ИКПУ или код упаковки). Проверьте строки и повторите.",
            PharmacySqlConstraintMessage.of(error)
        );
    }
}
