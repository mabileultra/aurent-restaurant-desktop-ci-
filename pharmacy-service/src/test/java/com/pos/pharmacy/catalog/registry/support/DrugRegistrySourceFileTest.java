package com.pos.pharmacy.catalog.registry.support;

import org.junit.jupiter.api.Test;

import java.io.OutputStream;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

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

    @Test
    void unpacksZipWithCyrillicEntryNamesViaCp866() throws Exception {
        Path zip = Files.createTempFile("drug-reg-", ".zip");
        Path xlsx = Files.createTempFile("lek-", ".xlsx");
        Files.write(xlsx, new byte[] {
            0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00
        });
        try (ZipOutputStream out = new ZipOutputStream(
            Files.newOutputStream(zip),
            Charset.forName("CP866")
        )) {
            out.putNextEntry(new ZipEntry("Лекарства.xlsx"));
            Files.copy(xlsx, out);
            out.closeEntry();
        }
        DrugRegistrySourceFile source = new DrugRegistrySourceFile("", zip.toString(), "");
        DrugRegistrySourceFile.Opened opened = source.open();
        assertTrue(Files.size(opened.path()) > 0);
        opened.close();
        Files.deleteIfExists(zip);
        Files.deleteIfExists(xlsx);
    }
}
