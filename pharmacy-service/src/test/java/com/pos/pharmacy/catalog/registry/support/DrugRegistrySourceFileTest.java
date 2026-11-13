package com.pos.pharmacy.catalog.registry.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DrugRegistrySourceFileTest {

    @Test
    void medicinesWorkbookWinsOverDevices() {
        assertTrue(DrugRegistrySourceFile.prefers(
            "Лекарства отечественных производителей.xlsx",
            "Медицинские изделия.xlsx"
        ));
        assertFalse(DrugRegistrySourceFile.prefers(
            "Субстанции.xlsx",
            "Лекарства.xlsx"
        ));
    }

    @Test
    void findsFirstFilesHostLinkOnRegistryPage() {
        String html = """
            <p>Дополнения к Государственному Реестру №30</p>
            <a href="https://files.uzpharm-control.uz/?dl=d9276a59cf0234cd1d9d10b0c826e143">Скачать файл</a>
            """;
        assertEquals(
            "https://files.uzpharm-control.uz/?dl=d9276a59cf0234cd1d9d10b0c826e143",
            DrugRegistrySourceFile.firstDownloadLink(html)
        );
    }
}
