package com.pos.identity.service.user.support;

import com.pos.identity.entity.User;
import com.pos.identity.exception.IdentityExceptions;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.repository.spec.UserSpecifications;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.service.support.UserLookupSupport;
import com.pos.identity.util.UserLoginUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserAccessPolicy {

    private final UserRepository userRepository;
    private final UserLookupSupport userLookup;
    private final TenantAccessSupport tenantAccess;

    public boolean canView(User user) {
        if (RoleName.PLATFORM_ADMIN.matches(user)) {
            return false;
        }
        if (RoleName.SUPER_ADMIN.matches(user) && !tenantAccess.isSuperAdmin()) {
            return false;
        }
        if (tenantAccess.isPlatformOperator()) {
            return true;
        }
        User actor = tenantAccess.currentUser();
        if (actor.getCompanyId() == null) {
            return false;
        }
        return user.getCompanyId() != null && actor.getCompanyId().equals(user.getCompanyId());
    }

    public Integer companyId(User user) {
        return user.getCompanyId();
    }

    public User requireAccessible(UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> IdentityExceptions.notFound("User", id));
        if (!canView(user)) {
            throw IdentityExceptions.badRequest("Access denied");
        }
        return user;
    }

    public void assertRoleAllowedForCreate(String roleName) {
        if (RoleName.isPlatformScope(roleName)) {
            throw IdentityExceptions.badRequest("Cannot assign platform role");
        }
        if (tenantAccess.isPlatformOperator()) {
            return;
        }
        if (!List.of("ADMIN", "MANAGER", "CASHIER", "WAITER", "COURIER", "COOK", "ACCOUNTANT").contains(roleName)) {
            throw IdentityExceptions.badRequest("Invalid role for tenant admin");
        }
        if ("ADMIN".equals(roleName)) {
            throw IdentityExceptions.badRequest("Only platform admin can create company administrators");
        }
    }

    public Integer resolveCompanyIdForCreate(Integer requestedCompanyId, String roleName) {
        if ("ADMIN".equals(roleName) || "MANAGER".equals(roleName) || "CASHIER".equals(roleName)
            || "WAITER".equals(roleName) || "COURIER".equals(roleName) || "COOK".equals(roleName)
            || "ACCOUNTANT".equals(roleName)) {
            if (tenantAccess.isPlatformOperator()) {
                if (requestedCompanyId == null) {
                    throw IdentityExceptions.badRequest("Company is required for this role");
                }
                return tenantAccess.requireCompanyId(requestedCompanyId);
            }
            User actor = tenantAccess.currentUser();
            if (actor.getCompanyId() == null) {
                throw IdentityExceptions.badRequest("Your account is not linked to a company");
            }
            return actor.getCompanyId();
        }
        return null;
    }

    public void assertUsernameAvailable(Integer companyId, String username, UUID excludeUserId) {
        if (companyId == null) {
            if (userLookup.exists(
                UserSpecifications.lookup().platformOnly().usernameIgnoreCase(username).excludeId(excludeUserId)
            )) {
                throw IdentityExceptions.badRequest("Username already taken");
            }
            return;
        }
        if (userLookup.exists(
            UserSpecifications.lookup().tenantOnly().usernameIgnoreCase(username).excludeId(excludeUserId)
        )) {
            throw IdentityExceptions.badRequest("Username already taken");
        }
        if (userLookup.exists(
            UserSpecifications.lookup().platformOnly().usernameIgnoreCase(username).excludeId(excludeUserId)
        )) {
            throw IdentityExceptions.badRequest("Username already taken");
        }
    }

    public void assertEmailAvailable(Integer companyId, String email, UUID excludeUserId) {
        boolean taken = companyId == null
            ? userLookup.exists(
                UserSpecifications.lookup().platformOnly().emailIgnoreCase(email).excludeId(excludeUserId)
            )
            : userLookup.exists(
                UserSpecifications.lookup().companyId(companyId).emailIgnoreCase(email).excludeId(excludeUserId)
            );
        if (taken) {
            throw IdentityExceptions.badRequest("Email already registered in this company");
        }
    }

    public static void assertCashierStoreAssignment(String roleName, List<Integer> storeIds) {
        if (!"CASHIER".equalsIgnoreCase(roleName) && !"WAITER".equalsIgnoreCase(roleName)) {
            return;
        }
        if (storeIds == null || storeIds.size() != 1) {
            throw IdentityExceptions.badRequest("Cashier must be assigned to exactly one store");
        }
    }

    public void assertDeletable(User target) {
        User actor = tenantAccess.currentUser();
        if (actor.getId().equals(target.getId())) {
            throw IdentityExceptions.badRequest("Cannot delete your own account");
        }
        String targetRole = target.getRole().getName();
        if (RoleName.isPlatformScope(targetRole)) {
            throw IdentityExceptions.badRequest("Cannot delete platform administrator");
        }
        if (tenantAccess.isPlatformOperator()) {
            if (List.of("ADMIN", "MANAGER", "CASHIER", "WAITER", "COURIER", "COOK", "ACCOUNTANT").contains(targetRole)) {
                return;
            }
            throw IdentityExceptions.badRequest("Cannot delete this user");
        }
        if ("CASHIER".equals(targetRole) || "WAITER".equals(targetRole) || "COURIER".equals(targetRole)
            || "COOK".equals(targetRole)) {
            return;
        }
        throw IdentityExceptions.badRequest("Only cashiers can be deleted by company admin");
    }

    public User loadForResponse(UUID id, User fallback) {
        return userRepository.findByIdWithDetails(id).orElse(fallback);
    }
}
