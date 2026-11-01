package com.pos.identity.service.auth.impl;

import com.pos.identity.dto.auth.EdgeStaffIngestItem;
import com.pos.identity.dto.auth.EdgeStaffIngestRequest;
import com.pos.identity.dto.auth.EdgeStaffIngestResponse;
import com.pos.identity.entity.Role;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.RoleRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.repository.spec.UserSpecifications;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.auth.EdgeStaffIngestService;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.service.support.UserLookupSupport;
import com.pos.identity.service.support.UserSyncSupport;
import com.pos.identity.util.EmailAddressRules;
import com.pos.identity.util.UserLoginUtil;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EdgeStaffIngestServiceImpl implements EdgeStaffIngestService {

    private static final Set<String> INGEST_ROLES = Set.of(
        "MANAGER", "CASHIER", "WAITER", "COOK", "ACCOUNTANT", "COURIER"
    );

    private final TenantAccessSupport tenantAccess;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserLookupSupport userLookup;
    private final UserSyncSupport userSyncSupport;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public EdgeStaffIngestResponse ingest(EdgeStaffIngestRequest request) {
        User actor = tenantAccess.currentUser();
        String actorRole = actor.getRole() != null ? actor.getRole().getName() : "";
        if (!RoleName.SUPER_ADMIN.matches(actor)
            && !RoleName.PLATFORM_ADMIN.matches(actor)
            && !"ADMIN".equals(actorRole)
            && !"MANAGER".equals(actorRole)) {
            throw new BadRequestException("Only ADMIN/MANAGER can ingest edge staff");
        }
        Integer companyId = actor.getCompanyId();
        if (companyId == null) {
            throw new BadRequestException("Company not found");
        }

        List<EdgeStaffIngestItem> staff = request.staff() == null ? List.of() : request.staff();
        int upserted = 0;
        int skipped = 0;
        for (EdgeStaffIngestItem item : staff) {
            try {
                if (upsertOne(companyId, item)) {
                    upserted++;
                } else {
                    skipped++;
                }
            } catch (Exception ex) {
                skipped++;
                LogUtil.warn(
                    EdgeStaffIngestServiceImpl.class,
                    "edge staff ingest skip userId=" + (item == null ? null : item.userId())
                        + ": " + ex.getMessage()
                );
            }
        }
        return new EdgeStaffIngestResponse(upserted, skipped, companyId);
    }

    private boolean upsertOne(Integer companyId, EdgeStaffIngestItem item) {
        if (item == null || item.userId() == null || !StringUtils.hasText(item.username())) {
            return false;
        }
        String roleName = StringUtils.hasText(item.role()) ? item.role().trim() : "WAITER";
        if (!INGEST_ROLES.contains(roleName)) {
            return false;
        }
        Role role = roleRepository.findByName(roleName).orElse(null);
        if (role == null) {
            return false;
        }

        String username = UserLoginUtil.normalizeUsername(item.username());
        if (userLookup.exists(
            UserSpecifications.lookup().tenantOnly().usernameIgnoreCase(username).excludeId(item.userId())
        )) {
            return false;
        }

        User existing = userRepository.findByIdWithDetails(item.userId()).orElse(null);
        if (existing != null) {
            if (existing.getCompanyId() == null || !companyId.equals(existing.getCompanyId())) {
                return false;
            }
            if (isCloudNewer(existing.getUpdatedAt(), item.updatedAt())) {
                return false;
            }
            applyFields(existing, companyId, role, username, item);
            userRepository.save(existing);
            userSyncSupport.syncUpdate(existing);
            return true;
        }

        User created = User.builder()
            .id(item.userId())
            .username(username)
            .email(resolveEmail(item))
            .password(resolvePasswordHash(item.passwordHash()))
            .fullName(resolveFullName(item, username))
            .role(role)
            .companyId(companyId)
            .storeIds(toStoreSet(item.storeIds()))
            .isActive(item.active() == null || item.active())
            .build();
        if (StringUtils.hasText(item.pinHash())) {
            created.setPinDigest(item.pinHash().trim());
        }
        created.syncFullName();
        userRepository.save(created);
        userSyncSupport.syncCreate(created);
        return true;
    }

    private void applyFields(User user, Integer companyId, Role role, String username, EdgeStaffIngestItem item) {
        user.setUsername(username);
        user.setEmail(resolveEmail(item));
        user.setFullName(resolveFullName(item, username));
        user.setRole(role);
        user.setCompanyId(companyId);
        if (item.storeIds() != null) {
            user.setStoreIds(toStoreSet(item.storeIds()));
        }
        if (StringUtils.hasText(item.passwordHash())) {
            user.setPassword(item.passwordHash().trim());
        }
        if (StringUtils.hasText(item.pinHash())) {
            String digest = item.pinHash().trim();
            if (!userLookup.exists(
                UserSpecifications.lookup().companyId(companyId).pinDigest(digest).excludeId(user.getId())
            )) {
                user.setPinDigest(digest);
            }
        }
        if (item.active() != null) {
            user.setActive(item.active());
        }
        user.syncFullName();
    }

    private static boolean isCloudNewer(Instant cloudUpdatedAt, Instant localUpdatedAt) {
        if (cloudUpdatedAt == null || localUpdatedAt == null) {
            return false;
        }
        return cloudUpdatedAt.isAfter(localUpdatedAt);
    }

    private String resolvePasswordHash(String hash) {
        if (StringUtils.hasText(hash)) {
            return hash.trim();
        }
        return passwordEncoder.encode(UUID.randomUUID() + "Aa1!");
    }

    private static String resolveFullName(EdgeStaffIngestItem item, String username) {
        if (StringUtils.hasText(item.fullName())) {
            return item.fullName().trim();
        }
        return username;
    }

    private static String resolveEmail(EdgeStaffIngestItem item) {
        String raw = UserLoginUtil.normalizeEmail(item.email());
        if (EmailAddressRules.isValid(raw)) {
            return raw;
        }
        String compact = item.userId().toString().replace("-", "");
        return "edge." + compact + "@aurent.uz";
    }

    private static Set<Integer> toStoreSet(List<Integer> storeIds) {
        if (storeIds == null || storeIds.isEmpty()) {
            return new HashSet<>();
        }
        return new HashSet<>(storeIds);
    }
}
