package com.pos.identity.security;

import com.pos.identity.entity.User;
import com.pos.identity.exception.ResourceNotFoundException;
import com.pos.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CurrentUserProvider {

    private final UserRepository userRepository;

    public User requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && StringUtils.hasText(auth.getName())) {
            try {
                UUID id = UUID.fromString(auth.getName());
                return userRepository.findByIdWithDetails(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
            } catch (IllegalArgumentException ignored) {
                return userRepository.findByIdWithDetails(UUID.fromString(auth.getName()))
                    .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
            }
        }
        throw new ResourceNotFoundException("Current user not found");
    }

    public boolean isSuperAdmin(User user) {
        return RoleName.SUPER_ADMIN.matches(user);
    }

    public boolean isPlatformOperator(User user) {
        return RoleName.isPlatformOperator(user);
    }
}
