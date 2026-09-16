package com.pos.pharmacy.warehouse.dto.importing;

import java.util.List;

public record PharmacyImportMatchResponse(
    String uzInvoiceDocumentId,
    boolean invoiceAlreadyImported,
    List<PharmacyImportMatchItem> items
) {}
