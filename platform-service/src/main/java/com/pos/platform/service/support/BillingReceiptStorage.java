package com.pos.platform.service.support;

import com.pos.platform.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;

@Component
public class BillingReceiptStorage {

    private static final Set<String> ALLOWED = Set.of(
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp"
    );

    private final Path uploadDir;

    public BillingReceiptStorage(@Value("${app.billing.upload-dir:./data/billing-uploads}") String uploadDir) {
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    public StoredReceipt store(Integer companyId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        if (!ALLOWED.contains(contentType) && !looksAllowedByName(file.getOriginalFilename())) {
            throw new BadRequestException("Разрешены только PDF, PNG, JPG");
        }
        try {
            Path companyDir = uploadDir.resolve(String.valueOf(companyId));
            Files.createDirectories(companyDir);
            String safeName = sanitize(file.getOriginalFilename());
            String stored = UUID.randomUUID() + "_" + safeName;
            Path target = companyDir.resolve(stored);
            file.transferTo(target);
            return new StoredReceipt(safeName, contentType.isBlank() ? "application/octet-stream" : contentType, target.toString());
        } catch (IOException e) {
            throw new BadRequestException("Не удалось сохранить файл чека");
        }
    }

    private static boolean looksAllowedByName(String name) {
        if (name == null) {
            return false;
        }
        String lower = name.toLowerCase();
        return lower.endsWith(".pdf") || lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp");
    }

    private static String sanitize(String name) {
        if (name == null || name.isBlank()) {
            return "receipt.bin";
        }
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    public record StoredReceipt(String fileName, String contentType, String storagePath) {}
}
