package com.pos.catalog.dto.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ProductImportConfirmRequest(
    String strategy,
    String source,
    Boolean skipDuplicates,
    Integer defaultCategoryId,
    Integer defaultStoreId,
    /** Расположение на складе для всех новых позиций, если в файле/строке не задано. */
    String defaultStorageLocation,
    /** Поставщик прихода (только AS_RECEIPT). */
    UUID supplierId,
    /** CASH | CREDIT — как в обычном приходе. */
    String paymentType,
    /** Комментарий к приходу; если пусто — «Импорт …». */
    String receiptNotes,
    @Valid List<ImportRowConfirm> rows
) {
    public record ImportRowConfirm(
        int rowNum,
        @DecimalMin("0.01") BigDecimal sellingPrice,
        Integer categoryId,
        Integer storeId,
        String storageLocation,
        String ikpu,
        String barcode,
        String packageCode,
        Boolean markedProduct,
        String ikpuStatus,
        /** Количество строки. Пусто — берётся из файла. */
        @DecimalMin("0") BigDecimal quantity
    ) {
    }
}
