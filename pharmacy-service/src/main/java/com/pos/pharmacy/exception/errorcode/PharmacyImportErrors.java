package com.pos.pharmacy.exception.errorcode;

import com.pos.pharmacy.exception.PharmacyErrorCode;
import org.springframework.http.HttpStatus;

public enum PharmacyImportErrors implements PharmacyErrorCode {
    PHARM_IMPORT_FILE_REQUIRED(HttpStatus.BAD_REQUEST, "Выберите файл Excel или PDF"),
    PHARM_IMPORT_FILE_UNREADABLE(HttpStatus.BAD_REQUEST, "Не удалось прочитать файл"),
    PHARM_IMPORT_FILE_PARSE_FAILED(HttpStatus.BAD_REQUEST, "Не удалось разобрать файл"),
    PHARM_IMPORT_NO_ROWS(HttpStatus.BAD_REQUEST, "В файле нет строк товаров"),
    PHARM_IMPORT_NOT_PDF(HttpStatus.BAD_REQUEST, "Файл не является PDF"),
    PHARM_IMPORT_PDF_READ_FAILED(HttpStatus.BAD_REQUEST, "Не удалось прочитать PDF"),
    PHARM_IMPORT_JSON_PARSE_FAILED(HttpStatus.BAD_REQUEST, "Не удалось разобрать JSON"),
    PHARM_IMPORT_EXCEL_READ_FAILED(HttpStatus.BAD_REQUEST, "Не удалось прочитать Excel"),
    PHARM_IMPORT_EXCEL_WRITE_FAILED(HttpStatus.BAD_REQUEST, "Не удалось сформировать Excel"),
    PHARM_IMPORT_EMPTY_HEADERS(HttpStatus.BAD_REQUEST, "Файл пуст: отсутствует строка заголовков"),
    PHARM_IMPORT_PDF_NO_TEXT(
        HttpStatus.BAD_REQUEST,
        "В PDF не найден текст. Загрузите текстовый PDF или Excel."
    ),
    PHARM_IMPORT_JSON_NO_ITEMS(HttpStatus.BAD_REQUEST, "В JSON не найдено позиций товаров"),
    PHARM_IMPORT_EXCEL_INVALID(HttpStatus.BAD_REQUEST, "Файл не является корректным Excel"),
    PHARM_IMPORT_TABLE_NOT_FOUND(HttpStatus.BAD_REQUEST, "Не найдена таблица товаров в счёт-фактуре"),
    PHARM_IMPORT_TEMPLATE_MISMATCH(HttpStatus.BAD_REQUEST, "Неверный шаблон файла");

    private final HttpStatus status;
    private final String message;

    PharmacyImportErrors(HttpStatus status, String message) {
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
