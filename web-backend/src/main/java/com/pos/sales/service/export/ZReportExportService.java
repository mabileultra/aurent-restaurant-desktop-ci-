package com.pos.sales.service.export;

import java.time.LocalDate;

public interface ZReportExportService {

    byte[] exportListExcel(
        String employeeSearch,
        String fiscalCardId,
        String terminalSerial,
        Integer storeId,
        LocalDate closedFrom,
        LocalDate closedTo
    );

    byte[] exportSalesForZReportExcel(Long zReportId);
}
