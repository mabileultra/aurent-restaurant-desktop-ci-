package com.pos.service.identity.impl;

import com.pos.client.crm.CrmOutboundClient;
import com.pos.dto.identity.internal.UserSyncRequest;
import com.pos.entity.Company;
import com.pos.entity.Role;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.sales.repository.CashierShiftRepository;
import com.pos.repository.CompanyRepository;
import com.pos.repository.RoleRepository;
import com.pos.sales.repository.SaleRepository;
import com.pos.repository.UserRepository;
import com.pos.security.cache.AuthenticatedUserCache;
import com.pos.service.identity.IdentityUserSyncService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IdentityUserSyncServiceImpl implements IdentityUserSyncService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CompanyRepository companyRepository;
    private final TenantAccessSupport tenantAccess;
    private final SaleRepository saleRepository;
    private final CashierShiftRepository cashierShiftRepository;
    private final CrmOutboundClient crmOutboundClient;
    private final AuthenticatedUserCache authenticatedUserCache;
    private final EntityManager entityManager;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void sync(UserSyncRequest request) {
        if (request == null || request.id() == null) {
            return;
        }
        if ("DELETE".equalsIgnoreCase(request.operation())) {
            deleteFromPos(request.id());
            return;
        }
        upsertToPos(request);
    }

    private void upsertToPos(UserSyncRequest request) {
        reconcileLegacyUsernameOwner(request);
        reconcilePinDigestOwner(request);

        Role role = roleRepository.findByName(request.role())
            .orElseThrow(() -> PosExceptions.badRequest("Invalid role: " + request.role()));

        Company company = request.companyId() != null
            ? companyRepository.findById(request.companyId()).orElse(null)
            : null;
        if (request.companyId() != null && company == null) {
            LogUtil.warn(
                IdentityUserSyncServiceImpl.class,
                "Identity user sync: company not found in pos_db, user will have no company link: userId={}, companyId={}",
                request.id(),
                request.companyId()
            );
        }

        Set<Store> stores = resolveStores(request.companyId(), request.storeIds());

        User user = userRepository.findById(request.id()).orElseGet(() -> User.builder().id(request.id()).build());
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPassword(request.passwordHash());
        user.setPinDigest(request.pinDigest());
        user.setFullName(request.fullName());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPatronymic(request.patronymic());
        user.setRole(role);
        user.setCompany(company);
        user.setStores(new HashSet<>(stores));
        user.setActive(request.active());
        user.setModuleAccessCustom(request.moduleAccessCustom());
        user.syncFullName();

        userRepository.save(user);
        authenticatedUserCache.evict(user.getId());
        LogUtil.info(IdentityUserSyncServiceImpl.class, "Identity user synced to pos_db: id={}, op={}", user.getId(), request.operation());
    }

    /**
     * Identity is source of truth for PIN. Free the digest from any other pos_db row so
     * bootstrap/sync can land the real user — otherwise open/close shift gets 403 (no user in core).
     */
    private void reconcilePinDigestOwner(UserSyncRequest request) {
        if (!StringUtils.hasText(request.pinDigest()) || request.companyId() == null || request.id() == null) {
            return;
        }
        List<User> conflicts = userRepository.findByCompany_IdAndPinDigest(request.companyId(), request.pinDigest());
        boolean cleared = false;
        for (User other : conflicts) {
            if (other.getId().equals(request.id())) {
                continue;
            }
            other.setPinDigest(null);
            userRepository.save(other);
            authenticatedUserCache.evict(other.getId());
            cleared = true;
            LogUtil.warn(
                IdentityUserSyncServiceImpl.class,
                "Cleared conflicting pin_digest on pos_db user: id={}, companyId={}, for identityUserId={}",
                other.getId(),
                request.companyId(),
                request.id()
            );
        }
        if (cleared) {
            entityManager.flush();
        }
    }

    private Set<Store> resolveStores(Integer companyId, List<Integer> storeIds) {
        if (companyId == null || storeIds == null || storeIds.isEmpty()) {
            return Set.of();
        }
        return tenantAccess.resolveStoresForUser(companyId, storeIds);
    }

    /**
     * До identity-service в pos_db могли остаться пользователи с тем же username, но другим UUID.
     * Identity — источник истины: освобождаем username перед upsert по id.
     */
    private void reconcileLegacyUsernameOwner(UserSyncRequest request) {
        if (!StringUtils.hasText(request.username())) {
            return;
        }
        userRepository.findByUsernameWithDetails(request.username())
            .filter(legacy -> !legacy.getId().equals(request.id()))
            .ifPresent(this::removeLegacyUsernameOwner);
    }

    private void removeLegacyUsernameOwner(User legacy) {
        UUID legacyId = legacy.getId();
        String username = legacy.getUsername();
        if (hasBlockingReferences(legacyId)) {
            String suffix = "__legacy__" + legacyId.toString().substring(0, 8);
            String renamed = username.length() + suffix.length() > 100
                ? username.substring(0, 100 - suffix.length()) + suffix
                : username + suffix;
            legacy.setUsername(renamed);
            legacy.setPinDigest(null);
            userRepository.save(legacy);
            entityManager.flush();
            authenticatedUserCache.evict(legacyId);
            LogUtil.warn(
                IdentityUserSyncServiceImpl.class,
                "Renamed legacy pos_db user and cleared pin_digest: id={}, username={}",
                legacyId,
                username
            );
            return;
        }
        authenticatedUserCache.evict(legacyId);
        userRepository.delete(legacy);
        entityManager.flush();
        LogUtil.info(
            IdentityUserSyncServiceImpl.class,
            "Removed legacy pos_db user with conflicting username: id={}, username={}",
            legacyId,
            username
        );
    }

    private void deleteFromPos(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return;
        }
        if (hasBlockingReferences(userId)) {
            user.setPinDigest(null);
            user.setActive(false);
            userRepository.save(user);
            entityManager.flush();
            authenticatedUserCache.evict(userId);
            LogUtil.warn(
                IdentityUserSyncServiceImpl.class,
                "Identity delete kept pos_db row (references), cleared pin_digest: userId={}",
                userId
            );
            return;
        }
        authenticatedUserCache.evict(userId);
        userRepository.delete(user);
        LogUtil.info(IdentityUserSyncServiceImpl.class, "Identity user deleted from pos_db: id={}", userId);
    }

    private boolean hasBlockingReferences(UUID userId) {
        return saleRepository.existsByCashier_Id(userId)
            || cashierShiftRepository.existsByCashier_Id(userId)
            || crmOutboundClient.existsOrderByCreator(userId);
    }
}
