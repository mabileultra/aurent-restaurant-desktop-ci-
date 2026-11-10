package com.pos.identity.service.security.support;

import com.pos.identity.dto.security.LoginRulesDto;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Component
@RequiredArgsConstructor
public class LoginLockSupport {

    private final UserRepository userRepository;

    public void assertNotLocked(User user) {
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(Instant.now())) {
            throw new BadRequestException("Аккаунт временно заблокирован. Попробуйте позже.");
        }
    }

    @Transactional
    public void onFailure(User user, LoginRulesDto rules) {
        int maxAttempts = rules != null && rules.attempts() > 0 ? rules.attempts() : 5;
        int lockMin = rules != null && rules.lockMin() > 0 ? rules.lockMin() : 15;
        int next = user.getFailedLoginCount() + 1;
        user.setFailedLoginCount(next);
        if (next >= maxAttempts) {
            user.setLockedUntil(Instant.now().plus(Duration.ofMinutes(lockMin)));
            user.setFailedLoginCount(0);
        }
        userRepository.save(user);
    }

    @Transactional
    public void onSuccess(User user) {
        if (user.getFailedLoginCount() == 0 && user.getLockedUntil() == null) {
            return;
        }
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        userRepository.save(user);
    }
}
