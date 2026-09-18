package com.pos.identity.service.auth.impl;

import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.JwtService;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.auth.TokenRefreshService;
import com.pos.identity.service.auth.support.AuthResponseFactory;
import com.pos.identity.service.support.UserSyncSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenRefreshServiceImpl implements TokenRefreshService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final UserSyncSupport userSyncSupport;
    private final AuthResponseFactory authResponseFactory;

    @Override
    @Transactional(readOnly = true)
    public AuthResponse refresh(String token) {
        UUID userId = jwtService.extractSubjectUserId(token);
        User user = userRepository.findByIdWithDetails(userId)
            .orElseThrow(() -> new BadRequestException("User not found"));

        if (!jwtService.isTokenValid(token, user)) {
            throw new BadRequestException("Invalid or expired token");
        }

        if (!RoleName.SUPER_ADMIN.matches(user)) {
            userSyncSupport.syncUpdate(user);
        }

        return authResponseFactory.build(user, jwtService.generateToken(user), null);
    }
}
