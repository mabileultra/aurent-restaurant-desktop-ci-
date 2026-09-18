package com.pos.identity.service.user.impl;

import com.pos.identity.entity.User;
import com.pos.identity.exception.IdentityExceptions;
import com.pos.identity.repository.spec.UserSpecifications;
import com.pos.identity.service.support.UserLookupSupport;
import com.pos.identity.security.PinSecret;
import com.pos.identity.service.user.UserPinService;
import com.pos.identity.util.CashierPinUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class UserPinServiceImpl implements UserPinService {

    private final UserLookupSupport userLookup;
    private final PinSecret pinSecret;

    @Override
    public void applyForCreate(User user, String roleName, Integer companyId, String pin) {
        if (!usesPin(roleName)) {
            return;
        }
        if (companyId == null) {
            throw IdentityExceptions.badRequest("Company is required for cashier");
        }
        user.setPinDigest(digestUniquePin(companyId, pin, null));
    }

    @Override
    public void applyForUpdate(User user, Integer companyId, String pin) {
        if (!usesPin(user.getRole().getName())) {
            throw IdentityExceptions.badRequest("PIN can only be set for cashier");
        }
        if (companyId == null) {
            throw IdentityExceptions.badRequest("Company is required for cashier");
        }
        user.setPinDigest(digestUniquePin(companyId, pin, user.getId()));
    }

    @Override
    public void clearOnRoleChange(User user, String oldRoleName, String newRoleName, String pinFromRequest) {
        if (usesPin(oldRoleName) && !usesPin(newRoleName)) {
            user.setPinDigest(null);
        }
        if (usesPin(newRoleName) && !usesPin(oldRoleName) && !StringUtils.hasText(pinFromRequest)) {
            throw IdentityExceptions.badRequest("Cashier PIN is required when assigning CASHIER role");
        }
    }

    private static boolean usesPin(String roleName) {
        return "CASHIER".equalsIgnoreCase(roleName) || "WAITER".equalsIgnoreCase(roleName);
    }

    private String digestUniquePin(Integer companyId, String pin, java.util.UUID excludeUserId) {
        String normalized = CashierPinUtil.normalizePin(pin);
        if (normalized.length() < 4 || normalized.length() > 6) {
            throw IdentityExceptions.badRequest("Cashier PIN must be 4-6 digits");
        }
        String digest = CashierPinUtil.digestHex(normalized, pinSecret.value());
        if (userLookup.exists(
            UserSpecifications.lookup().companyId(companyId).pinDigest(digest).excludeId(excludeUserId)
        )) {
            throw IdentityExceptions.badRequest("PIN already used in this company");
        }
        return digest;
    }
}
