package com.pos.restaurant.edge.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.edge.dto.EdgeAuthResponse;
import com.pos.restaurant.edge.dto.EdgeCloudPinUpsertRequest;
import com.pos.restaurant.edge.dto.EdgeLoginRequest;
import com.pos.restaurant.edge.dto.EdgePinLoginRequest;
import com.pos.restaurant.edge.dto.EdgePinRosterEntry;
import com.pos.restaurant.edge.dto.EdgeStaffBootstrapRequest;
import com.pos.restaurant.edge.entity.EdgeStaff;
import com.pos.restaurant.edge.repository.EdgeStaffRepository;
import com.pos.restaurant.edge.support.EdgePinDigest;
import com.pos.restaurant.edge.support.EdgeStaffBootstrapApplier;
import com.pos.restaurant.exception.BusinessException;
import com.pos.shared.jwt.JwtClaimsExtractor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeAuthService {

    private final EdgeStaffRepository staffRepository;
    private final EdgeJwtIssuer jwtIssuer;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final ObjectProvider<EdgeStoreService> edgeStoreService;
    private final EdgeStaffBootstrapApplier staffBootstrapApplier;

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

    /** FE always tries /auth/refresh on 401 — edge must support it or login loops back to PIN. */
    @Transactional(readOnly = true)
    public EdgeAuthResponse refresh(String authorizationHeader) {
        if (!StringUtils.hasText(authorizationHeader) || !authorizationHeader.startsWith("Bearer ")) {
            throw new BusinessException("Invalid or expired token");
        }
        String token = authorizationHeader.substring(7).trim();
        UUID userId;
        try {
            userId = JwtClaimsExtractor.extract(token, jwtSecret).userId();
        } catch (RuntimeException ex) {
            throw new BusinessException("Invalid or expired token");
        }
        EdgeStaff staff = staffRepository.findById(userId)
            .filter(EdgeStaff::isActive)
            .orElseThrow(() -> new BusinessException("Invalid or expired token"));
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
        EdgeStoreService stores = edgeStoreService.getIfAvailable();
        if (stores != null) {
            stores.upsertFromStoreIds(request.companyId(), request.storeIds());
        }
        return toAuthResponse(row, jwtIssuer.issue(row));
    }

    @Transactional
    public int bootstrap(EdgeStaffBootstrapRequest request) {
        return staffBootstrapApplier.apply(request);
    }

    @Transactional(readOnly = true)
    public boolean hasStaff() {
        return staffRepository.countByActiveTrue() > 0;
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> listUsers(Integer companyId) {
        Integer cid = companyId != null ? companyId : inferCompanyId();
        if (cid == null) return List.of();
        return staffRepository.findByCompanyIdOrderByFullNameAsc(cid).stream()
            .map(this::toUserDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getUser(UUID id) {
        EdgeStaff staff = staffRepository.findById(id)
            .orElseThrow(() -> new BusinessException("User not found"));
        return toUserDto(staff);
    }

    @Transactional
    public java.util.Map<String, Object> createUser(java.util.Map<String, Object> body) {
        Integer companyId = intVal(body.get("companyId"));
        if (companyId == null) companyId = inferCompanyId();
        if (companyId == null) throw new BusinessException("companyId required");
        String username = str(body.get("username"));
        if (!StringUtils.hasText(username)) throw new BusinessException("username required");
        if (staffRepository.existsByUsernameIgnoreCase(username.trim())) {
            throw new BusinessException("Username already exists");
        }
        EdgeStaff row = new EdgeStaff();
        row.setUserId(UUID.randomUUID());
        row.setCompanyId(companyId);
        row.setCompanyLoginCode(firstNonBlank(str(body.get("companyLoginCode")), inferCompanyLoginCode(companyId)));
        row.setUsername(username.trim());
        row.setEmail(str(body.get("email")));
        row.setFullName(resolveFullName(body));
        row.setRole(StringUtils.hasText(str(body.get("role"))) ? str(body.get("role")).trim() : "WAITER");
        row.setPasswordHash(resolvePasswordHash(null, str(body.get("password")), null));
        row.setPinHash(resolvePinHash(null, str(body.get("pin")), null));
        row.setStoreIdsJson(writeJson(body.get("storeIds")));
        row.setAllowedModulesJson(writeJson(body.get("allowedModules")));
        row.setCanRequestBill(Boolean.TRUE.equals(body.get("canRequestBill")));
        row.setActive(body.get("active") == null || Boolean.TRUE.equals(body.get("active")));
        row.setUpdatedAt(Instant.now());
        staffRepository.save(row);
        return toUserDto(row);
    }

    @Transactional
    public java.util.Map<String, Object> updateUser(UUID id, java.util.Map<String, Object> body) {
        EdgeStaff row = staffRepository.findById(id)
            .orElseThrow(() -> new BusinessException("User not found"));
        if (body.containsKey("username") && StringUtils.hasText(str(body.get("username")))) {
            String username = str(body.get("username")).trim();
            if (!username.equalsIgnoreCase(row.getUsername())
                && staffRepository.existsByUsernameIgnoreCase(username)) {
                throw new BusinessException("Username already exists");
            }
            row.setUsername(username);
        }
        if (body.containsKey("email")) row.setEmail(str(body.get("email")));
        if (body.containsKey("fullName") || body.containsKey("firstName") || body.containsKey("lastName")) {
            row.setFullName(resolveFullName(body));
        }
        if (body.containsKey("role") && StringUtils.hasText(str(body.get("role")))) {
            row.setRole(str(body.get("role")).trim());
        }
        if (StringUtils.hasText(str(body.get("password")))) {
            row.setPasswordHash(passwordEncoder.encode(str(body.get("password")).trim()));
        }
        if (StringUtils.hasText(str(body.get("pin")))) {
            row.setPinHash(EdgePinDigest.digestHex(EdgePinDigest.normalizePin(str(body.get("pin"))), pinSecret));
        }
        if (body.containsKey("storeIds")) row.setStoreIdsJson(writeJson(body.get("storeIds")));
        if (body.containsKey("allowedModules")) row.setAllowedModulesJson(writeJson(body.get("allowedModules")));
        if (body.containsKey("canRequestBill")) {
            row.setCanRequestBill(Boolean.TRUE.equals(body.get("canRequestBill")));
        }
        if (body.containsKey("active")) row.setActive(Boolean.TRUE.equals(body.get("active")));
        row.setUpdatedAt(Instant.now());
        staffRepository.save(row);
        return toUserDto(row);
    }

    @Transactional
    public java.util.Map<String, Object> toggleUser(UUID id) {
        EdgeStaff row = staffRepository.findById(id)
            .orElseThrow(() -> new BusinessException("User not found"));
        row.setActive(!row.isActive());
        row.setUpdatedAt(Instant.now());
        staffRepository.save(row);
        return toUserDto(row);
    }

    @Transactional
    public void deleteUser(UUID id) {
        EdgeStaff row = staffRepository.findById(id)
            .orElseThrow(() -> new BusinessException("User not found"));
        row.setActive(false);
        row.setUpdatedAt(Instant.now());
        staffRepository.save(row);
    }

    private java.util.Map<String, Object> toUserDto(EdgeStaff staff) {
        java.util.Map<String, Object> m = new java.util.HashMap<>();
        m.put("id", staff.getUserId());
        m.put("userId", staff.getUserId());
        m.put("username", staff.getUsername());
        m.put("email", staff.getEmail());
        m.put("fullName", staff.getFullName());
        m.put("role", staff.getRole());
        m.put("companyId", staff.getCompanyId());
        m.put("companyLoginCode", staff.getCompanyLoginCode());
        m.put("storeIds", readIntList(staff.getStoreIdsJson()));
        m.put("allowedModules", readStringList(staff.getAllowedModulesJson()));
        m.put("canRequestBill", staff.isCanRequestBill());
        m.put("active", staff.isActive());
        m.put("hasPin", StringUtils.hasText(staff.getPinHash()));
        if (StringUtils.hasText(staff.getFullName()) && staff.getFullName().contains(" ")) {
            int sp = staff.getFullName().indexOf(' ');
            m.put("firstName", staff.getFullName().substring(0, sp));
            m.put("lastName", staff.getFullName().substring(sp + 1));
        } else {
            m.put("firstName", staff.getFullName());
            m.put("lastName", null);
        }
        return m;
    }

    private Integer inferCompanyId() {
        return staffRepository.findAll().stream().map(EdgeStaff::getCompanyId).findFirst().orElse(null);
    }

    private String inferCompanyLoginCode(Integer companyId) {
        return staffRepository.findByCompanyIdOrderByFullNameAsc(companyId).stream()
            .map(EdgeStaff::getCompanyLoginCode)
            .filter(StringUtils::hasText)
            .findFirst()
            .orElse(null);
    }

    private static String resolveFullName(java.util.Map<String, Object> body) {
        if (StringUtils.hasText(str(body.get("fullName")))) return str(body.get("fullName")).trim();
        String first = str(body.get("firstName"));
        String last = str(body.get("lastName"));
        String mid = str(body.get("patronymic"));
        String joined = java.util.stream.Stream.of(last, first, mid)
            .filter(StringUtils::hasText)
            .map(String::trim)
            .reduce((a, b) -> a + " " + b)
            .orElse(null);
        return joined;
    }

    private static String str(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    private static Integer intVal(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(v).trim());
        } catch (Exception e) {
            return null;
        }
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
            StringUtils.hasText(staff.getAllowedModulesJson())
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
