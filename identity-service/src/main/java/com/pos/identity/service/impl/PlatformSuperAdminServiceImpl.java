package com.pos.identity.service.impl;

import com.pos.identity.dto.platform.security.CreatePlatformSuperAdminRequest;
import com.pos.identity.dto.platform.security.PlatformSuperAdminResponse;
import com.pos.identity.dto.platform.security.UpdatePlatformSuperAdminRequest;
import com.pos.identity.entity.Role;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.exception.ConflictException;
import com.pos.identity.exception.ResourceNotFoundException;
import com.pos.identity.repository.RoleRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.repository.spec.UserSpecifications;
import com.pos.identity.security.PlatformStaffRole;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.PlatformSuperAdminService;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.service.support.UserSyncSupport;
import com.pos.shared.log.LogUtil;
import com.pos.identity.util.EmailAddressRules;
import com.pos.identity.util.PersonNameUtil;
import com.pos.identity.util.UserLoginUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlatformSuperAdminServiceImpl implements PlatformSuperAdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantAccessSupport tenantAccess;
    private final UserSyncSupport userSyncSupport;

    @Override
    public List<PlatformSuperAdminResponse> listSuperAdmins() {
        assertSuperAdminActor();
        return userRepository.findAll(
            UserSpecifications.listPlatformStaff(
                RoleName.SUPER_ADMIN.key(),
                RoleName.PLATFORM_ADMIN.key(),
                RoleName.PLATFORM_ANALYTICS.key()
            )
        ).stream()
            .map(this::toSuperAdminResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = false)
    public PlatformSuperAdminResponse createSuperAdmin(CreatePlatformSuperAdminRequest request) {
        assertSuperAdminActor();
        String roleName = PlatformStaffRole.resolveCreateRole(request.role());
        Role role = roleRepository.findByName(roleName)
            .orElseThrow(() -> new BadRequestException(roleName + " role is not configured"));

        String username = UserLoginUtil.normalizeUsername(request.username());
        String email = EmailAddressRules.require(request.email());
        assertPlatformUsernameAvailable(username, null);
        assertPlatformEmailAvailable(email, null);

        User user = User.builder()
            .username(username)
            .email(email)
            .password(passwordEncoder.encode(request.password().trim()))
            .firstName(request.firstName().trim())
            .lastName(request.lastName().trim())
            .fullName(PersonNameUtil.buildFullName(request.lastName(), request.firstName(), null))
            .role(role)
            .companyId(null)
            .isActive(true)
            .moduleAccessCustom(false)
            .build();
        user.syncFullName();
        User saved = userRepository.save(user);
        userSyncSupport.syncCreate(saved);
        LogUtil.info(PlatformSuperAdminServiceImpl.class, "Platform staff created: id={}, username={}, role={}", saved.getId(), saved.getUsername(), roleName);
        return toSuperAdminResponse(saved);
    }

    @Override
    @Transactional(readOnly = false)
    public PlatformSuperAdminResponse updateSuperAdmin(UUID id, UpdatePlatformSuperAdminRequest request) {
        assertSuperAdminActor();
        User user = requirePlatformStaff(id);

        if (StringUtils.hasText(request.firstName())) {
            user.setFirstName(request.firstName().trim());
        }
        if (StringUtils.hasText(request.lastName())) {
            user.setLastName(request.lastName().trim());
        }
        user.syncFullName();

        if (StringUtils.hasText(request.password())) {
            user.setPassword(passwordEncoder.encode(request.password().trim()));
        }

        User saved = userRepository.save(user);
        userSyncSupport.syncUpdate(saved);
        LogUtil.info(PlatformSuperAdminServiceImpl.class, "Platform super-admin updated: id={}", id);
        return toSuperAdminResponse(saved);
    }

    private PlatformSuperAdminResponse toSuperAdminResponse(User user) {
        return new PlatformSuperAdminResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getFullName(),
            user.getRole().getName(),
            user.isActive()
        );
    }

    private User requirePlatformStaff(UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!RoleName.isPlatformScope(user) || user.getCompanyId() != null) {
            throw new BadRequestException("User is not a platform administrator");
        }
        return user;
    }

    private void assertSuperAdminActor() {
        if (!tenantAccess.isSuperAdmin()) {
            throw new BadRequestException("Access denied");
        }
    }

    private void assertPlatformUsernameAvailable(String username, UUID excludeId) {
        long count = userRepository.count(
            UserSpecifications.lookup().platformOnly().usernameIgnoreCase(username).excludeId(excludeId).build()
        );
        if (count > 0) {
            throw new ConflictException("Username already taken");
        }
    }

    private void assertPlatformEmailAvailable(String email, UUID excludeId) {
        long count = userRepository.count(
            UserSpecifications.lookup().platformOnly().emailIgnoreCase(email).excludeId(excludeId).build()
        );
        if (count > 0) {
            throw new ConflictException("Email already taken");
        }
    }
}
