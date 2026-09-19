package com.pos.pharmacy.exception;

/** Человекочитаемые тексты вместо SQL из PostgreSQL/Hibernate. */
public final class PharmacySqlConstraintMessage {

    private PharmacySqlConstraintMessage() {}

    public static String of(Throwable error) {
        String text = fold(error);
        if (text.contains("fk_stock_lots_receipt_line")) {
            return "Строку нельзя удалить: по ней уже создана партия. Обновите страницу и повторите.";
        }
        if (text.contains("varying(190)") || text.contains("character varying(190)")) {
            return "Код маркировки слишком длинный. Повторите проведение документа.";
        }
        if (text.contains("uk_pharm_stock_marks_company_key")) {
            return "Этот код маркировки уже есть на складе.";
        }
        if (text.contains("stock_receipts_receipt_number_key")) {
            return "Номер прихода уже занят. Обновите страницу и создайте документ ещё раз.";
        }
        return "Не удалось сохранить документ. Повторите попытку.";
    }

    private static String fold(Throwable error) {
        StringBuilder sb = new StringBuilder();
        Throwable current = error;
        int depth = 0;
        while (current != null && depth < 12) {
            if (current.getMessage() != null) {
                sb.append(current.getMessage().toLowerCase()).append(' ');
            }
            current = current.getCause();
            depth++;
        }
        return sb.toString();
    }
}
