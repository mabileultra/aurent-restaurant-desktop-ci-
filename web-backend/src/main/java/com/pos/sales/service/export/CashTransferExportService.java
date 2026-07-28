package com.pos.sales.service.export;

import java.time.LocalDate;

public interface CashTransferExportService {

    byte[] exportTransfersExcel(
        String storeSearch,
        Integer registerNumber,
        LocalDate closedFrom,
        LocalDate closedTo
    );
}
