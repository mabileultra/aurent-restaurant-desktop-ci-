package com.pos.platform.service.support;

import com.pos.platform.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Component
public class BillingReceiptStorage {

    private static final Set<String> ALLOWED = Set.of(
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "application/octet-stream"
    );

    private final Path uploadDir;

    public BillingReceiptStorage(@Value("${app.billing.upload-dir:./data/billing-uploads}") String uploadDir) {
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    public StoredReceipt store(Integer companyId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        String originalName = file.getOriginalFilename();
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase(Locale.ROOT) : "";
        if (!ALLOWED.contains(contentType) && !looksAllowedByName(originalName)) {
            throw new BadRequestException("Разрешены только PDF, PNG, JPG");
        }
        try {
            Path companyDir = uploadDir.resolve(String.valueOf(companyId));
            Files.createDirectories(companyDir);
            String safeName = sanitize(originalName);
            Path target = companyDir.resolve(UUID.randomUUID() + "_" + safeName).normalize();
            if (!target.startsWith(companyDir)) {
                throw new BadRequestException("Некорректное имя файла");
            }
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            String storedType = contentType.isBlank() || "application/octet-stream".equals(contentType)
                ? guessType(safeName)
                : contentType;
            return new StoredReceipt(safeName, storedType, target.toString());
        } catch (IOException e) {
            throw new BadRequestException("Не удалось сохранить файл чека: " + e.getMessage());
        }
    }

    private static String guessType(String name) {
        String lower = name.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    private static boolean looksAllowedByName(String name) {
        if (name == null) {
            return false;
        }
        String lower = name.toLowerCase(Locale.ROOT);
        return lower.endsWith(".pdf") || lower.endsWith(".png") || lower.endsWith(".jpg")
            || lower.endsWith(".jpeg") || lower.endsWith(".webp");
    }

    private static String sanitize(String name) {
        if (name == null || name.isBlank()) {
            return "receipt.bin";
        }
        String base = Path.of(name).getFileName().toString();
        return base.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    public record StoredReceipt(String fileName, String contentType, String storagePath) {}
}
