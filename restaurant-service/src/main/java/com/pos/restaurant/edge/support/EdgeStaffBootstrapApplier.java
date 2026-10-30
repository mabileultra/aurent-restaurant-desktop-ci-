package com.pos.restaurant.edge.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.edge.dto.EdgeStaffBootstrapItem;
import com.pos.restaurant.edge.dto.EdgeStaffBootstrapRequest;
import com.pos.restaurant.edge.entity.EdgeStaff;
import com.pos.restaurant.edge.repository.EdgeStaffRepository;
import com.pos.restaurant.edge.service.EdgeStoreService;
import com.pos.restaurant.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Import / replace local edge_staff from cloud export.
 * replaceRoster=true deactivates company rows absent from the payload (online reconcile).
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeStaffBootstrapApplier {

    private final EdgeStaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final ObjectProvider<EdgeStoreService> edgeStoreService;

    @Value("${app.restaurant.edge.bootstrap-secret:}")
    private String bootstrapSecret;

    @Value("${app.pin.secret}")
    private String pinSecret;

    @Transactional
    public int apply(EdgeStaffBootstrapRequest request) {
        boolean replace = Boolean.TRUE.equals(request.replaceRoster());
        List<EdgeStaffBootstrapItem> staff = request.staff() == null ? List.of() : request.staff();
        if (staff.isEmpty() && !replace) {
            throw new BusinessException("staff required");
        }

        long existing = staffRepository.countByActiveTrue();
        if (existing == 0) {
            if (StringUtils.hasText(bootstrapSecret)
                && !bootstrapSecret.equals(String.valueOf(request.bootstrapSecret()))) {
                throw new BusinessException("Invalid bootstrap secret");
            }
        }

        int saved = 0;
        Set<Integer> storeIds = new HashSet<>();
        Set<UUID> keepIds = new HashSet<>();
        for (EdgeStaffBootstrapItem item : staff) {
            if (item == null || item.userId() == null || !StringUtils.hasText(item.username())) {
                continue;
            }
            EdgeStaff row = staffRepository.findById(item.userId()).orElseGet(EdgeStaff::new);
            row.setUserId(item.userId());
            row.setCompanyId(request.companyId());
            row.setCompanyLoginCode(firstNonBlank(item.companyLoginCode(), request.companyLoginCode()));
            row.setUsername(item.username().trim());
            row.setEmail(item.email());
            row.setFullName(item.fullName());
            row.setRole(StringUtils.hasText(item.role()) ? item.role().trim() : "WAITER");
            row.setPasswordHash(resolvePasswordHash(item.passwordHash(), item.password(), row.getPasswordHash()));
            row.setPinHash(resolvePinHash(item.pinHash(), item.pin(), row.getPinHash()));
            row.setStoreIdsJson(writeJson(item.storeIds()));
            row.setAllowedModulesJson(writeJson(item.allowedModules()));
            row.setCanRequestBill(Boolean.TRUE.equals(item.canRequestBill()));
            row.setActive(item.active() == null || item.active());
            row.setUpdatedAt(Instant.now());
            staffRepository.save(row);
            keepIds.add(item.userId());
            if (item.storeIds() != null) {
                storeIds.addAll(item.storeIds());
            }
            saved++;
        }

        int deactivated = 0;
        if (replace && request.companyId() != null) {
            for (EdgeStaff row : staffRepository.findByCompanyIdOrderByFullNameAsc(request.companyId())) {
                if (keepIds.contains(row.getUserId()) || !row.isActive()) {
                    continue;
                }
                row.setActive(false);
                row.setUpdatedAt(Instant.now());
                staffRepository.save(row);
                deactivated++;
            }
        }

        EdgeStoreService stores = edgeStoreService.getIfAvailable();
        if (stores != null && !storeIds.isEmpty()) {
            stores.upsertFromStoreIds(request.companyId(), storeIds);
        }
        return saved + deactivated;
    }

    private String resolvePasswordHash(String hash, String plaintext, String existing) {
        if (StringUtils.hasText(hash)) {
            return hash.trim();
        }
        if (StringUtils.hasText(plaintext)) {
            return passwordEncoder.encode(plaintext.trim());
        }
        return existing;
    }

    private String resolvePinHash(String hash, String plaintext, String existing) {
        if (StringUtils.hasText(hash)) {
            return hash.trim();
        }
        if (StringUtils.hasText(plaintext)) {
            return EdgePinDigest.digestHex(EdgePinDigest.normalizePin(plaintext), pinSecret);
        }
        return existing;
    }

    private String writeJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return null;
        }
    }

    private static String firstNonBlank(String a, String b) {
        if (StringUtils.hasText(a)) {
            return a.trim();
        }
        if (StringUtils.hasText(b)) {
            return b.trim();
        }
        return null;
    }
}
