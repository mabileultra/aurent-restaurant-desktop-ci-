package com.pos.pharmacy.exception.errorcode;

import com.pos.pharmacy.exception.PharmacyErrorCode;
import org.springframework.http.HttpStatus;

public enum PharmacyReceiptErrors implements PharmacyErrorCode {
    PHARM_RECEIPT_NOT_FOUND(HttpStatus.NOT_FOUND, "Приход не найден"),
    PHARM_RECEIPT_LINE_NOT_FOUND(HttpStatus.NOT_FOUND, "Строка прихода не найдена"),
    PHARM_RECEIPT_DRAFT_ONLY(HttpStatus.BAD_REQUEST, "Менять можно только черновик прихода"),
    PHARM_RECEIPT_EMPTY(HttpStatus.BAD_REQUEST, "Добавьте хотя бы одну строку"),
    PHARM_RECEIPT_ACTIVATE_EMPTY(HttpStatus.BAD_REQUEST, "Нельзя вывести на кассу документ без строк"),
    PHARM_RECEIPT_NO_LINES_TO_SAVE(HttpStatus.BAD_REQUEST, "Нет строк для сохранения"),
    PHARM_RECEIPT_NO_LINES_TO_UPDATE(HttpStatus.BAD_REQUEST, "Нет строк для обновления"),
    PHARM_RECEIPT_NO_LINES_TO_REVALUE(HttpStatus.BAD_REQUEST, "Нет строк для переоценки"),
    PHARM_RECEIPT_REVALUE_PARAMS(HttpStatus.BAD_REQUEST, "Укажите НДС и/или наценку"),
    PHARM_RECEIPT_MASS_FIELD_REQUIRED(HttpStatus.BAD_REQUEST, "Укажите поле для массового изменения"),
    PHARM_RECEIPT_MASS_FIELD_UNKNOWN(HttpStatus.BAD_REQUEST, "Неизвестное поле массового изменения"),
    PHARM_RECEIPT_POSTED_FIELD_LOCKED(
        HttpStatus.BAD_REQUEST,
        "После проведения можно менять только цены. Количество, серия и срок нельзя."
    ),
    PHARM_RECEIPT_QTY_POSITIVE(HttpStatus.BAD_REQUEST, "Количество должно быть больше нуля"),
    PHARM_RECEIPT_EXPIRY_FORMAT(HttpStatus.BAD_REQUEST, "Срок годности: ГГГГ-ММ-ДД"),
    PHARM_RECEIPT_AMOUNT_NEGATIVE(HttpStatus.BAD_REQUEST, "Сумма не может быть отрицательной"),
    PHARM_RECEIPT_PERCENT_RANGE(HttpStatus.BAD_REQUEST, "Процент вне допустимого диапазона"),
    PHARM_RECEIPT_FIELD_REQUIRED(HttpStatus.BAD_REQUEST, "Поле обязательно"),
    PHARM_RECEIPT_FIELD_NOT_NUMBER(HttpStatus.BAD_REQUEST, "Поле должно быть числом"),
    PHARM_RECEIPT_PAYMENT_TYPE(HttpStatus.BAD_REQUEST, "Тип оплаты: CASH, DEBT или TRANSFER"),
    PHARM_RECEIPT_AMOUNT_TOO_LARGE(
        HttpStatus.BAD_REQUEST,
        "Сумма слишком большая. В цену или количество попал ИКПУ или штрихкод."
    ),
    PHARM_RECEIPT_NUMBER_TAKEN(
        HttpStatus.CONFLICT,
        "Номер прихода уже занят. Обновите страницу и создайте документ ещё раз."
    ),
    PHARM_RECEIPT_LINE_HAS_LOT(
        HttpStatus.BAD_REQUEST,
        "Строку нельзя удалить: по ней уже создана партия. Обновите страницу и повторите."
    ),
    PHARM_RECEIPT_SAVE_FAILED(HttpStatus.BAD_REQUEST, "Не удалось сохранить документ. Повторите попытку."),
    PHARM_RECEIPT_VALUE_TOO_LONG(
        HttpStatus.BAD_REQUEST,
        "Слишком длинное значение (серия, штрихкод, ИКПУ или код упаковки). Проверьте строки и повторите."
    ),
    PHARM_IMPORT_INVOICE_DUPLICATE(HttpStatus.BAD_REQUEST, "Этот счёт-фактура уже импортирован"),
    PHARM_IMPORT_NO_QTY_LINES(
        HttpStatus.BAD_REQUEST,
        "Нет строк с количеством. Назначьте колонку «Количество» и цену продажи, затем повторите импорт."
    );

    private final HttpStatus status;
    private final String message;

    PharmacyReceiptErrors(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    @Override
    public HttpStatus status() {
        return status;
    }

    @Override
    public String message() {
        return message;
    }
}
