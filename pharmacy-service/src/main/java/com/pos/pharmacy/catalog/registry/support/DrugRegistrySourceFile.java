package com.pos.pharmacy.catalog.registry.support;

import com.pos.pharmacy.exception.BusinessException;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyDrugRegistryErrors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Enumeration;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/** Локальный файл или URL. ZIP раскрывается до Excel лекарств. */
@Component
public class DrugRegistrySourceFile {

    private final String url;
    private final String file;
    private final HttpClient http = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(30))
        .followRedirects(HttpClient.Redirect.NORMAL)
        .build();

    private final String pageUrl;

    public DrugRegistrySourceFile(
        @Value("${app.pharmacy.drug-registry.url:}") String url,
        @Value("${app.pharmacy.drug-registry.file:}") String file,
        @Value("${app.pharmacy.drug-registry.page-url:https://old.uzpharm-control.uz/ru/pages/state-register-of-medicines-and-medical-products}")
        String pageUrl
    ) {
        this.url = url == null ? "" : url.trim();
        this.file = file == null ? "" : file.trim();
        this.pageUrl = pageUrl == null ? "" : pageUrl.trim();
    }

    public boolean configured() {
        return !url.isBlank() || !file.isBlank() || !pageUrl.isBlank();
    }

    public Opened open() {
        if (!file.isBlank()) {
            Path path = Path.of(file);
            if (!Files.isRegularFile(path)) {
                throw PharmacyErrors.of(
                    PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_FETCH_FAILED,
                    "Файл реестра не найден"
                );
            }
            return openLocal(path, path.getFileName().toString(), file, false);
        }
        String downloadUrl = !url.isBlank() ? url : discoverDownloadUrl();
        if (downloadUrl == null || downloadUrl.isBlank()) {
            return null;
        }
        return openLocal(download(downloadUrl), fileName(downloadUrl), downloadUrl, true);
    }

    public Opened openLocal(Path path, String name, String sourceLabel, boolean temporary) {
        return unwrap(path, name, sourceLabel, temporary);
    }

    private String discoverDownloadUrl() {
        if (pageUrl.isBlank()) {
            return null;
        }
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(pageUrl))
                .timeout(Duration.ofSeconds(45))
                .GET()
                .header("User-Agent", "AurentPharmacyDrugRegistry/1.0")
                .header("Accept", "text/html,*/*")
                .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw PharmacyErrors.of(
                    PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_FETCH_FAILED,
                    "HTTP " + response.statusCode() + " при чтении страницы реестра"
                );
            }
            String found = firstDownloadLink(response.body());
            if (found == null) {
                throw PharmacyErrors.of(
                    PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_FETCH_FAILED,
                    "На странице реестра не найдена ссылка на файл"
                );
            }
            return found;
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception e) {
            throw PharmacyErrors.of(
                PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_FETCH_FAILED,
                e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()
            );
        }
    }

    static String firstDownloadLink(String html) {
        if (html == null || html.isBlank()) {
            return null;
        }
        java.util.regex.Matcher matcher = java.util.regex.Pattern
            .compile("https://files\\.uzpharm-control\\.uz/\\?dl=[a-f0-9]+", java.util.regex.Pattern.CASE_INSENSITIVE)
            .matcher(html);
        return matcher.find() ? matcher.group() : null;
    }

    private Path download(String downloadUrl) {
        try {
            Path temp = Files.createTempFile("drug-registry-", suffix(downloadUrl));
            HttpRequest request = HttpRequest.newBuilder(URI.create(downloadUrl))
                .timeout(Duration.ofMinutes(3))
                .GET()
                .header("User-Agent", "AurentPharmacyDrugRegistry/1.0")
                .header("Accept", "*/*")
                .header("Referer", pageUrl.isBlank() ? "https://old.uzpharm-control.uz/" : pageUrl)
                .build();
            HttpResponse<InputStream> response = http.send(request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                Files.deleteIfExists(temp);
                throw PharmacyErrors.of(
                    PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_FETCH_FAILED,
                    "HTTP " + response.statusCode()
                );
            }
            try (InputStream in = response.body()) {
                Files.copy(in, temp, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }
            rejectCaptchaPage(temp);
            return temp;
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception e) {
            throw PharmacyErrors.of(
                PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_FETCH_FAILED,
                e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()
            );
        }
    }

    private static void rejectCaptchaPage(Path path) throws IOException {
        byte[] head = Files.readAllBytes(path);
        int n = Math.min(head.length, 512);
        String start = new String(head, 0, n, java.nio.charset.StandardCharsets.UTF_8).toLowerCase(Locale.ROOT);
        if (start.contains("<!doctype html") || start.contains("<html") || start.contains("captcha")) {
            Files.deleteIfExists(path);
            throw PharmacyErrors.of(
                PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_FETCH_FAILED,
                "Сайт файлов требует капчу. Скачайте ZIP вручную и загрузите через /pharmacy/drug-registry/upload"
            );
        }
    }

    private Opened unwrap(Path source, String name, String sourceLabel, boolean deleteSource) {
        if (!isZip(source, name)) {
            return new Opened(source, name, sourceLabel, deleteSource);
        }
        Path extracted = extractMedicines(source);
        if (deleteSource) {
            try {
                Files.deleteIfExists(source);
            } catch (IOException ignored) {
                // временный архив не мешает импорту
            }
        }
        return new Opened(extracted, extracted.getFileName().toString(), sourceLabel, true);
    }

    private Path extractMedicines(Path zip) {
        Charset[] charsets = {
            StandardCharsets.UTF_8,
            Charset.forName("CP866"),
            Charset.forName("windows-1251"),
            Charset.forName("IBM437")
        };
        Exception last = null;
        for (Charset charset : charsets) {
            try {
                Path chosen = extractWithCharset(zip, charset);
                if (chosen != null) {
                    return chosen;
                }
            } catch (Exception e) {
                last = e;
            }
        }
        String detail = last != null && last.getMessage() != null ? last.getMessage() : "неизвестная ошибка";
        throw PharmacyErrors.of(
            PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_PARSE_FAILED,
            "Не удалось распаковать ZIP (" + detail + ")"
        );
    }

    private Path extractWithCharset(Path zip, Charset charset) throws IOException {
        Path chosen = null;
        String chosenName = null;
        try (ZipFile archive = new ZipFile(zip.toFile(), charset)) {
            Enumeration<? extends ZipEntry> entries = archive.entries();
            while (entries.hasMoreElements()) {
                ZipEntry entry = entries.nextElement();
                String entryName = entry.getName();
                if (entry.isDirectory() || !isExcelName(entryName)) {
                    continue;
                }
                if (chosen == null || prefers(entryName, chosenName)) {
                    if (chosen != null) {
                        Files.deleteIfExists(chosen);
                    }
                    chosen = Files.createTempFile("drug-registry-", excelSuffix(entryName));
                    try (InputStream in = archive.getInputStream(entry)) {
                        Files.copy(in, chosen, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                    }
                    chosenName = entryName;
                }
            }
        }
        if (chosen == null) {
            throw PharmacyErrors.of(
                PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_PARSE_FAILED,
                "В архиве нет Excel"
            );
        }
        return chosen;
    }

    private static boolean isZip(Path path, String name) {
        String lower = name == null ? "" : name.toLowerCase(Locale.ROOT);
        // .xlsx/.xls — OOXML/OLE ZIP-контейнеры; не распаковывать как архив реестра
        if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
            return false;
        }
        if (lower.endsWith(".zip")) {
            return true;
        }
        try (InputStream in = Files.newInputStream(path)) {
            byte[] head = in.readNBytes(4);
            return head.length >= 4
                && head[0] == 'P'
                && head[1] == 'K'
                && (head[2] == 3 || head[2] == 5 || head[2] == 7)
                && (head[3] == 4 || head[3] == 6 || head[3] == 8);
        } catch (IOException e) {
            return false;
        }
    }

    private static boolean isExcelName(String entryName) {
        String lower = entryName == null ? "" : entryName.toLowerCase(Locale.ROOT);
        return lower.endsWith(".xlsx") || lower.endsWith(".xls");
    }

    private static String excelSuffix(String entryName) {
        String lower = entryName == null ? "" : entryName.toLowerCase(Locale.ROOT);
        return lower.endsWith(".xls") && !lower.endsWith(".xlsx") ? ".xls" : ".xlsx";
    }

    static boolean prefers(String candidate, String current) {
        int left = score(candidate);
        int right = score(current);
        return left > right;
    }

    private static int score(String name) {
        String n = name == null ? "" : name.toLowerCase(Locale.ROOT);
        if (n.contains("субст") || n.contains("техн") || n.contains("издел") || n.contains("diagn")) {
            return 0;
        }
        if (n.contains("лек") || n.contains("dori") || n.contains("drug") || n.contains("prepar")) {
            return 2;
        }
        return 1;
    }

    private static String suffix(String sourceUrl) {
        String lower = sourceUrl.toLowerCase(Locale.ROOT);
        if (lower.contains(".zip")) {
            return ".zip";
        }
        return ".xlsx";
    }

    private static String fileName(String sourceUrl) {
        int slash = sourceUrl.lastIndexOf('/');
        String name = slash >= 0 ? sourceUrl.substring(slash + 1) : "drug-registry.xlsx";
        int query = name.indexOf('?');
        return query >= 0 ? name.substring(0, query) : name;
    }

    public record Opened(Path path, String fileName, String source, boolean temporary) {
        public void close() {
            if (temporary && path != null) {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ignored) {
                    // временный файл можно оставить
                }
            }
        }
    }
}
