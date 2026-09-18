package com.pos.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;

/**
 * Восстанавливает сетку Didox hisob-faktura по полосам колонок 1…N.
 * Если нумерованного ряда нет — обычная сетка по зазорам (простые PDF).
 */
public final class DidoxInvoiceTableRebuilder {

    public List<List<String>> rebuild(List<PdfTextToken> tokens) {
        if (tokens == null || tokens.isEmpty()) {
            return List.of();
        }
        List<PdfVisualLine> lines = PdfVisualLineCluster.cluster(tokens);
        return DidoxInvoiceColumnLayout.find(lines)
            .map(header -> rebuildDidox(lines, header))
            .orElseGet(() -> PdfGapGridBuilder.toGrid(lines));
    }

    private static List<List<String>> rebuildDidox(List<PdfVisualLine> lines,
                                                   DidoxInvoiceColumnLayout.NumberedHeader numbered) {
        DidoxInvoiceColumnLayout layout = DidoxInvoiceColumnLayout.from(numbered);
        DidoxInvoiceHeaderMerger.MergedHeader header = DidoxInvoiceHeaderMerger.merge(lines, numbered, layout);
        List<List<String>> grid = new ArrayList<>();
        for (int i = 0; i < header.firstLineIndex(); i++) {
            String joined = lines.get(i).joined();
            if (joined != null && !joined.isBlank()) {
                grid.add(List.of(joined));
            }
        }
        if (header.cells().stream().anyMatch(cell -> cell != null && !cell.isBlank())) {
            grid.add(header.cells());
        }
        grid.addAll(DidoxInvoiceRowAssembler.assemble(lines, numbered.lineIndex() + 1, layout));
        return grid;
    }
}
