package com.pos.identity.bootstrap;

import com.pos.identity.entity.Role;
import com.pos.identity.entity.User;
import com.pos.identity.entity.UserModuleAccess;
import com.pos.identity.entity.UserModuleAccessId;
import com.pos.identity.repository.RoleRepository;
import com.pos.identity.repository.UserModuleAccessRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.repository.spec.UserSpecifications;
import com.pos.identity.security.PlatformAdminModule;
import com.pos.identity.security.RoleName;
import com.pos.identity.util.PersonNameUtil;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class PlatformOperatorProvisionerImpl implements PlatformOperatorProvisioner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserModuleAccessRepository userModuleAccessRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public int ensureSeeded() {
        Role role = roleRepository.findByName(RoleName.PLATFORM_ADMIN.key()).orElse(null);
        if (role == null) {
            LogUtil.warn(PlatformOperatorProvisionerImpl.class, "PLATFORM_ADMIN role is missing, skip operator seed");
            return 0;
        }
        if (existsPlatformUsername(PlatformOperatorAccounts.USERNAME)) {
            return 0;
        }

        User saved = userRepository.saveAndFlush(newOperator(role));
        grantAllPlatformModules(saved);
        LogUtil.info(
            PlatformOperatorProvisionerImpl.class,
            "Seeded PLATFORM_ADMIN username={}",
            saved.getUsername()
        );
        return 1;
    }

    private User newOperator(Role role) {
        User user = User.builder()
            .username(PlatformOperatorAccounts.USERNAME)
            .email(PlatformOperatorAccounts.EMAIL)
            .password(passwordEncoder.encode(PlatformOperatorAccounts.PASSWORD))
            .firstName(PlatformOperatorAccounts.FIRST_NAME)
            .lastName(PlatformOperatorAccounts.LAST_NAME)
            .fullName(PersonNameUtil.buildFullName(
                PlatformOperatorAccounts.LAST_NAME,
                PlatformOperatorAccounts.FIRST_NAME,
                null
            ))
            .role(role)
            .companyId(null)
            .isActive(true)
            .moduleAccessCustom(true)
            .build();
        user.syncFullName();
        return user;
    }

    private void grantAllPlatformModules(User user) {
        for (String key : PlatformAdminModule.keys()) {
            userModuleAccessRepository.save(UserModuleAccess.builder()
                .id(new UserModuleAccessId(user.getId(), key))
                .user(user)
                .allowed(true)
                .build());
        }
    }

    private boolean existsPlatformUsername(String username) {
        return userRepository.count(
            UserSpecifications.lookup().platformOnly().usernameIgnoreCase(username).build()
        ) > 0;
    }
}
