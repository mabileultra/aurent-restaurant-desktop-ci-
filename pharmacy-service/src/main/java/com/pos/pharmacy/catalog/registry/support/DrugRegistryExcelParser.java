package com.pos.pharmacy.catalog.registry.support;

import com.pos.pharmacy.catalog.registry.dto.DrugRegistryParsedRow;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyDrugRegistryErrors;
import com.pos.pharmacy.support.PharmacyParallelTasks;
import com.pos.pharmacy.warehouse.support.PharmacyMassExecutor;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
public class DrugRegistryExcelParser {

    private static final int MAP_CHUNK = 500;

    private final PharmacyMassExecutor massExecutor;
    private final DataFormatter formatter = new DataFormatter(Locale.ROOT);

    public List<DrugRegistryParsedRow> parse(Path xlsx) {
        try (InputStream in = Files.newInputStream(xlsx); Workbook wb = WorkbookFactory.create(in)) {
            Sheet sheet = sheetWithName(wb);
            Header header = detect(sheet);
            if (header == null || header.name < 0) {
                throw PharmacyErrors.of(
                    PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_PARSE_FAILED,
                    "Не найден столбец торгового названия"
                );
            }
            List<RawLine> raw = extract(sheet, header);
            if (raw.isEmpty()) {
                throw PharmacyErrors.of(
                    PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_PARSE_FAILED,
                    "В Excel нет строк лекарств"
                );
            }
            return mapParallel(raw);
        } catch (com.pos.pharmacy.exception.BusinessException ex) {
            throw ex;
        } catch (Exception e) {
            throw PharmacyErrors.of(
                PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_PARSE_FAILED,
                e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()
            );
        }
    }

    private List<RawLine> extract(Sheet sheet, Header header) {
        List<RawLine> raw = new ArrayList<>();
        for (int r = header.row + 1; r <= sheet.getLastRowNum(); r++) {
            Row line = sheet.getRow(r);
            if (line == null) {
                continue;
            }
            String name = cell(line, header.name);
            if (name == null || name.isBlank()) {
                continue;
            }
            raw.add(new RawLine(
                name.trim(),
                text(line, header.registration),
                text(line, header.inn),
                text(line, header.form),
                text(line, header.manufacturer),
                text(line, header.country),
                text(line, header.atc),
                cell(line, header.prescription)
            ));
        }
        return raw;
    }

    private List<DrugRegistryParsedRow> mapParallel(List<RawLine> raw) {
        List<List<RawLine>> chunks = split(raw, MAP_CHUNK);
        List<Supplier<List<DrugRegistryParsedRow>>> tasks = new ArrayList<>(chunks.size());
        for (List<RawLine> chunk : chunks) {
            tasks.add(() -> mapChunk(chunk));
        }
        List<List<DrugRegistryParsedRow>> parts = PharmacyParallelTasks.supplyAll(tasks, massExecutor.executor());
        List<DrugRegistryParsedRow> rows = new ArrayList<>(raw.size());
        for (List<DrugRegistryParsedRow> part : parts) {
            rows.addAll(part);
        }
        return rows;
    }

    private static List<DrugRegistryParsedRow> mapChunk(List<RawLine> chunk) {
        List<DrugRegistryParsedRow> rows = new ArrayList<>(chunk.size());
        for (RawLine line : chunk) {
            rows.add(new DrugRegistryParsedRow(
                line.name(),
                line.registration(),
                line.inn(),
                line.form(),
                line.manufacturer(),
                line.country(),
                line.atc(),
                DrugRegistryPrescription.parse(line.prescription())
            ));
        }
        return rows;
    }

    private static List<List<RawLine>> split(List<RawLine> raw, int size) {
        List<List<RawLine>> out = new ArrayList<>();
        for (int i = 0; i < raw.size(); i += size) {
            out.add(raw.subList(i, Math.min(i + size, raw.size())));
        }
        return out;
    }

    private Sheet sheetWithName(Workbook wb) {
        Sheet fallback = wb.getNumberOfSheets() > 0 ? wb.getSheetAt(0) : null;
        for (int i = 0; i < wb.getNumberOfSheets(); i++) {
            String name = wb.getSheetName(i).toLowerCase(Locale.ROOT);
            if (name.contains("лек") || name.contains("dori") || name.contains("drug")) {
                return wb.getSheetAt(i);
            }
        }
        if (fallback == null) {
            throw PharmacyErrors.of(PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_PARSE_FAILED, "Пустой Excel");
        }
        return fallback;
    }

    private Header detect(Sheet sheet) {
        int max = Math.min(sheet.getLastRowNum(), 30);
        for (int r = 0; r <= max; r++) {
            Row row = sheet.getRow(r);
            if (row == null) {
                continue;
            }
            Header header = new Header(r);
            short last = row.getLastCellNum();
            for (int c = 0; c < last; c++) {
                String n = norm(cell(row, c));
                if (n.isBlank()) {
                    continue;
                }
                assign(header, c, n);
            }
            if (header.name >= 0) {
                return header;
            }
        }
        return null;
    }

    private static void assign(Header header, int column, String n) {
        if (header.country < 0 && (n.contains("стран") || n.contains("давлат") || n.contains("country"))) {
            header.country = column;
        } else if (header.manufacturer < 0 && (n.contains("произв") || n.contains("ишлаб") || n.contains("manufacturer"))) {
            header.manufacturer = column;
        } else if (header.prescription < 0 && (n.contains("рецепт") || n.contains("retsept") || n.contains("отпуск"))) {
            header.prescription = column;
        } else if (header.atc < 0 && (n.contains("атх") || n.contains("atc"))) {
            header.atc = column;
        } else if (header.registration < 0 && (n.contains("регистр") || n.contains("гувох") || n.contains("удостовер"))) {
            header.registration = column;
        } else if (header.inn < 0 && (n.contains("мнн") || n.contains("inn") || n.contains("непатент"))) {
            header.inn = column;
        } else if (header.form < 0 && (n.contains("форма") || n.contains("шакл"))) {
            header.form = column;
        } else if (header.name < 0 && (n.contains("торгов") || n.contains("trade") || n.contains("наимен")
            || n.contains("номи") || n.contains("препарат"))) {
            header.name = column;
        }
    }

    private String text(Row row, int column) {
        String value = cell(row, column);
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String cell(Row row, int column) {
        if (row == null || column < 0) {
            return null;
        }
        return formatter.formatCellValue(row.getCell(column));
    }

    private static String norm(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.toLowerCase(Locale.ROOT).replace('\u00a0', ' ').trim();
    }

    private record RawLine(
        String name,
        String registration,
        String inn,
        String form,
        String manufacturer,
        String country,
        String atc,
        String prescription
    ) {
        RawLine {
            Objects.requireNonNull(name);
        }
    }

    private static final class Header {
        private final int row;
        private int name = -1;
        private int registration = -1;
        private int inn = -1;
        private int form = -1;
        private int manufacturer = -1;
        private int country = -1;
        private int atc = -1;
        private int prescription = -1;

        private Header(int row) {
            this.row = row;
        }
    }
}
