package com.pos.identity.support;

import com.pos.identity.entity.Role;
import com.pos.identity.entity.User;

import java.util.UUID;

public final class IdentityUsers {

    private IdentityUsers() {
    }

    public static User user(String roleName, Integer companyId) {
        return user(UUID.randomUUID(), roleName, companyId, false);
    }

    public static User user(UUID id, String roleName, Integer companyId) {
        return user(id, roleName, companyId, false);
    }

    public static User user(UUID id, String roleName, Integer companyId, boolean customAccess) {
        Role role = new Role();
        role.setName(roleName);
        return User.builder()
            .id(id)
            .username("user-" + roleName.toLowerCase())
            .email(roleName.toLowerCase() + "@pos.test")
            .password("hash")
            .fullName(roleName)
            .role(role)
            .companyId(companyId)
            .isActive(true)
            .moduleAccessCustom(customAccess)
            .build();
    }
}
