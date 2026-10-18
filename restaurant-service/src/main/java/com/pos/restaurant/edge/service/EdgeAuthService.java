package com.pos.restaurant.edge.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.edge.dto.EdgeAuthResponse;
import com.pos.restaurant.edge.dto.EdgeCloudPinUpsertRequest;
import com.pos.restaurant.edge.dto.EdgeLoginRequest;
import com.pos.restaurant.edge.dto.EdgePinLoginRequest;
import com.pos.restaurant.edge.dto.EdgePinRosterEntry;
import com.pos.restaurant.edge.dto.EdgeStaffBootstrapItem;
import com.pos.restaurant.edge.dto.EdgeStaffBootstrapRequest;
import com.pos.restaurant.edge.entity.EdgeStaff;
import com.pos.restaurant.edge.repository.EdgeStaffRepository;
import com.pos.restaurant.edge.support.EdgePinDigest;
import com.pos.restaurant.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeAuthService {

    private final EdgeStaffRepository staffRepository;
    private final EdgeJwtIssuer jwtIssuer;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Value("${app.restaurant.edge.bootstrap-secret:}")
    private String bootstrapSecret;

    @Value("${app.pin.secret}")
    private String pinSecret;

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Transactional(readOnly = true)
    public EdgeAuthResponse login(EdgeLoginRequest request) {
        EdgeStaff staff = staffRepository.findByUsernameIgnoreCaseAndActiveTrue(request.username().trim())
            .orElseThrow(() -> new BusinessException("Invalid credentials"));
        if (!StringUtils.hasText(staff.getPasswordHash())
            || !passwordEncoder.matches(request.password(), staff.getPasswordHash())) {
            throw new BusinessException("Invalid credentials");
        }
        return toAuthResponse(staff, jwtIssuer.issue(staff));
    }

    @Transactional(readOnly = true)
    public List<EdgePinRosterEntry> pinRoster(String companyLoginCode) {
        String code = companyLoginCode == null ? "" : companyLoginCode.trim();
        return staffRepository.findByCompanyLoginCodeAndActiveTrueOrderByFullNameAsc(code).stream()
            .filter(s -> StringUtils.hasText(s.getPinHash()))
            .map(s -> new EdgePinRosterEntry(
                s.getUserId(),
                StringUtils.hasText(s.getFullName()) ? s.getFullName() : s.getUsername(),
                s.getRole()
            ))
            .toList();
    }

    @Transactional(readOnly = true)
    public EdgeAuthResponse pinLogin(EdgePinLoginRequest request) {
        String code = request.companyLoginCode().trim();
        List<EdgeStaff> candidates = staffRepository.findByCompanyLoginCodeAndActiveTrueOrderByFullNameAsc(code);
        if (candidates.isEmpty()) {
            throw new BusinessException("Invalid PIN");
        }
        String pin = EdgePinDigest.normalizePin(request.pin());
        if (pin.length() < 4 || pin.length() > 6) {
            throw new BusinessException("Invalid PIN");
        }
        EdgeStaff match = null;
        for (EdgeStaff staff : candidates) {
            if (request.userId() != null && !staff.getUserId().equals(request.userId())) {
                continue;
            }
            if (!StringUtils.hasText(staff.getPinHash())) {
                continue;
            }
            if (pinMatchesStoredHash(pin, staff.getPinHash())) {
                match = staff;
                break;
            }
        }
        if (match == null) {
            throw new BusinessException("Invalid PIN");
        }
        return toAuthResponse(match, jwtIssuer.issue(match));
    }

    /**
     * After Electron verified PIN against cloud: store staff with PIN hashed by local secret
     * so offline PIN works even when cloud PIN_SECRET ≠ local.
     */
    @Transactional
    public EdgeAuthResponse upsertFromCloudPin(EdgeCloudPinUpsertRequest request) {
        if (StringUtils.hasText(bootstrapSecret)
            && !bootstrapSecret.equals(String.valueOf(request.bootstrapSecret()))) {
            throw new BusinessException("Invalid bootstrap secret");
        }
        String pin = EdgePinDigest.normalizePin(request.pin());
        if (pin.length() < 4 || pin.length() > 6) {
            throw new BusinessException("Invalid PIN");
        }
        EdgeStaff row = staffRepository.findById(request.userId()).orElseGet(EdgeStaff::new);
        row.setUserId(request.userId());
        row.setCompanyId(request.companyId());
        row.setCompanyLoginCode(firstNonBlank(request.companyLoginCode(), row.getCompanyLoginCode()));
        row.setUsername(request.username().trim());
        row.setEmail(request.email());
        row.setFullName(request.fullName());
        row.setRole(StringUtils.hasText(request.role()) ? request.role().trim() : "WAITER");
        row.setPinHash(EdgePinDigest.digestHex(pin, pinSecret));
        row.setStoreIdsJson(writeJson(request.storeIds()));
        row.setAllowedModulesJson(writeJson(request.allowedModules()));
        row.setCanRequestBill(Boolean.TRUE.equals(request.canRequestBill()));
        row.setActive(true);
        row.setUpdatedAt(Instant.now());
        if (!StringUtils.hasText(row.getPasswordHash())) {
            row.setPasswordHash(null);
        }
        staffRepository.save(row);
        return toAuthResponse(row, jwtIssuer.issue(row));
    }

    @Transactional
    public int bootstrap(EdgeStaffBootstrapRequest request) {
        long existing = staffRepository.countByActiveTrue();
        if (existing == 0) {
            if (StringUtils.hasText(bootstrapSecret)
                && !bootstrapSecret.equals(String.valueOf(request.bootstrapSecret()))) {
                throw new BusinessException("Invalid bootstrap secret");
            }
        }
        int saved = 0;
        for (EdgeStaffBootstrapItem item : request.staff()) {
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
            saved++;
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public boolean hasStaff() {
        return staffRepository.countByActiveTrue() > 0;
    }

    /** Accept cloud-exported digests hashed with JWT_SECRET / default key as well as local PIN_SECRET. */
    private boolean pinMatchesStoredHash(String pin, String storedHash) {
        String expected = storedHash == null ? "" : storedHash.trim();
        if (!StringUtils.hasText(expected)) {
            return false;
        }
        for (String key : pinSecretCandidates()) {
            if (expected.equalsIgnoreCase(EdgePinDigest.digestHex(pin, key))) {
                return true;
            }
        }
        return false;
    }

    private List<String> pinSecretCandidates() {
        List<String> keys = new ArrayList<>();
        if (StringUtils.hasText(pinSecret)) {
            keys.add(pinSecret.trim());
        }
        if (StringUtils.hasText(jwtSecret) && !keys.contains(jwtSecret.trim())) {
            keys.add(jwtSecret.trim());
        }
        String fallback = "aurent-default-pin-secret";
        if (!keys.contains(fallback)) {
            keys.add(fallback);
        }
        String changeMe = "change-me-use-at-least-32-chars-for-hs256!!";
        if (!keys.contains(changeMe)) {
            keys.add(changeMe);
        }
        return keys;
    }

    private String resolvePasswordHash(String existingHash, String plaintext, String keepIfBlank) {
        if (StringUtils.hasText(existingHash)) {
            return existingHash.trim();
        }
        if (StringUtils.hasText(plaintext)) {
            return passwordEncoder.encode(plaintext.trim());
        }
        return keepIfBlank;
    }

    private String resolvePinHash(String existingHash, String plaintext, String keepIfBlank) {
        if (StringUtils.hasText(existingHash)) {
            return existingHash.trim();
        }
        if (StringUtils.hasText(plaintext)) {
            String pin = EdgePinDigest.normalizePin(plaintext);
            return EdgePinDigest.digestHex(pin, pinSecret);
        }
        return keepIfBlank;
    }

    private EdgeAuthResponse toAuthResponse(EdgeStaff staff, String token) {
        String fullName = staff.getFullName();
        String first = fullName;
        String last = null;
        if (StringUtils.hasText(fullName) && fullName.contains(" ")) {
            int sp = fullName.indexOf(' ');
            first = fullName.substring(0, sp);
            last = fullName.substring(sp + 1);
        }
        return new EdgeAuthResponse(
            token,
            staff.getUserId().toString(),
            staff.getUsername(),
            staff.getEmail(),
            first,
            last,
            null,
            fullName,
            staff.getRole(),
            staff.getCompanyId(),
            staff.getCompanyLoginCode(),
            readIntList(staff.getStoreIdsJson()),
            readStringList(staff.getAllowedModulesJson()),
            false
        );
    }

    private String writeJson(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return null;
        }
    }

    private List<Integer> readIntList(String json) {
        if (!StringUtils.hasText(json)) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    private List<String> readStringList(String json) {
        if (!StringUtils.hasText(json)) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ex) {
            return new ArrayList<>();
        }
    }

    private static String firstNonBlank(String a, String b) {
        if (StringUtils.hasText(a)) return a.trim();
        if (StringUtils.hasText(b)) return b.trim();
        return null;
    }
}
