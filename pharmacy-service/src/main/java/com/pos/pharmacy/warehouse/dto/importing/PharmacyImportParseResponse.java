package com.pos.pharmacy.warehouse.dto.importing;

import java.util.List;

public record PharmacyImportParseResponse(
    String fileName,
    int headerRow,
    String uzInvoiceDocumentId,
    boolean invoiceAlreadyImported,
    List<PharmacyImportColumnHint> columns,
    List<List<String>> rows
) {}
