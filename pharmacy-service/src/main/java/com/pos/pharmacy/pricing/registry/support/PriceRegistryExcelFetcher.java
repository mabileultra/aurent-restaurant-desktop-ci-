package com.pos.pharmacy.pricing.registry.support;

import com.pos.pharmacy.exception.BusinessException;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyPriceRegistryErrors;
import com.pos.shared.log.LogUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;

/** Скачивает публичный Excel реестра предельных розничных цен. */
@Component
public class PriceRegistryExcelFetcher {

    private static final String USER_AGENT =
        "Mozilla/5.0 (compatible; AurentPharmacyPriceRegistry/1.0)";

    private final String excelUrl;
    private final HttpClient http = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(30))
        .followRedirects(HttpClient.Redirect.NORMAL)
        .build();

    public PriceRegistryExcelFetcher(
        @Value("${app.pharmacy.price-registry.page-url:https://api.mpa.uz/drug-catalog-api/v2/referent-price/excel}")
        String excelUrl
    ) {
        this.excelUrl = excelUrl;
    }

    public FetchedExcel fetchLatest() {
        Path temp;
        try {
            temp = Files.createTempFile("pharm-price-registry-", ".xlsx");
        } catch (IOException e) {
            throw PharmacyErrors.of(
                PharmacyPriceRegistryErrors.PHARM_PRICE_REGISTRY_FETCH_FAILED,
                "Не удалось создать временный файл"
            );
        }
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(excelUrl))
                .timeout(Duration.ofMinutes(3))
                .GET()
                .header("User-Agent", USER_AGENT)
                .header("Accept", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*")
                .build();
            HttpResponse<InputStream> response = http.send(request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                Files.deleteIfExists(temp);
                throw PharmacyErrors.of(
                    PharmacyPriceRegistryErrors.PHARM_PRICE_REGISTRY_FETCH_FAILED,
                    "HTTP " + response.statusCode() + " при скачивании " + excelUrl
                );
            }
            try (InputStream in = response.body()) {
                Files.copy(in, temp, StandardCopyOption.REPLACE_EXISTING);
            }
            String fileName = fileName(
                response.headers().firstValue("content-disposition").orElse(""),
                excelUrl
            );
            LogUtil.info(PriceRegistryExcelFetcher.class, "Downloaded registry excel {} from {}", fileName, excelUrl);
            return new FetchedExcel(excelUrl, fileName, temp);
        } catch (BusinessException ex) {
            safeDelete(temp);
            throw ex;
        } catch (Exception e) {
            safeDelete(temp);
            LogUtil.error(PriceRegistryExcelFetcher.class, "Registry download failed: {}", e.toString());
            throw PharmacyErrors.of(
                PharmacyPriceRegistryErrors.PHARM_PRICE_REGISTRY_FETCH_FAILED,
                e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()
            );
        }
    }

    static String fileName(String disposition, String excelUrl) {
        String quoted = between(disposition, "filename=\"", "\"");
        if (quoted != null && !quoted.isBlank()) {
            return quoted.trim();
        }
        int slash = excelUrl.lastIndexOf('/');
        String tail = slash >= 0 ? excelUrl.substring(slash + 1) : excelUrl;
        int query = tail.indexOf('?');
        if (query >= 0) {
            tail = tail.substring(0, query);
        }
        return tail.isBlank() ? "referent-prices.xlsx" : tail;
    }

    private static String between(String value, String open, String close) {
        int start = value.indexOf(open);
        if (start < 0) {
            return null;
        }
        start += open.length();
        int end = value.indexOf(close, start);
        if (end < 0) {
            return null;
        }
        return value.substring(start, end);
    }

    private static void safeDelete(Path temp) {
        try {
            Files.deleteIfExists(temp);
        } catch (IOException ignored) {
            // best-effort
        }
    }

    public record FetchedExcel(String sourceUrl, String fileName, Path path) {}
}
