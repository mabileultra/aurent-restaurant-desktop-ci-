package com.pos.reporting.export;

import java.util.List;

public interface ExcelSheetTemplate {

    String sheetName();

    List<ExcelColumn> columns();
}
