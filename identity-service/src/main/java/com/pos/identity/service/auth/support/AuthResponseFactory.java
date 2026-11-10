package com.pos.identity.service.auth.support;

import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.entity.User;
import com.pos.identity.mapper.AuthMapper;
import com.pos.identity.service.ModuleAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AuthResponseFactory {

    private final AuthMapper authMapper;
    private final ModuleAccessService moduleAccessService;

    public AuthResponse build(User user, String token, String companyLoginCode) {
        return authMapper.toResponse(
            user,
            token,
            companyLoginCode,
            moduleAccessService.resolveAllowedModuleIds(user),
            user.isModuleAccessCustom()
        );
    }

    public AuthResponse challenge(User user, String challengeToken) {
        return new AuthResponse(
            null,
            user.getId().toString(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getPatronymic(),
            user.getFullName(),
            user.getRole() != null ? user.getRole().getName() : null,
            user.getCompanyId(),
            null,
            List.of(),
            List.of(),
            user.isModuleAccessCustom(),
            true,
            challengeToken
        );
    }
}
