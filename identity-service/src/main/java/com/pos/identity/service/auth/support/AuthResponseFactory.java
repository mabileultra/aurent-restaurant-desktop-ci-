package com.pos.identity.service.auth.support;

import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.entity.User;
import com.pos.identity.mapper.AuthMapper;
import com.pos.identity.service.ModuleAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

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
}
