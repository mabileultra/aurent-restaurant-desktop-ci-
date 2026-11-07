package com.pos.service.email.support;

import com.pos.dto.email.SendBroadcastEmailRequest;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.UserRepository;
import com.pos.security.RoleName;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PlatformEmailRecipientResolver {

    private final UserRepository userRepository;

    public List<User> resolve(SendBroadcastEmailRequest request) {
        if (!hasAudience(request)) {
            throw new BadRequestException("Укажите получателей: роли, компании, пользователи или «всем»");
        }

        Map<UUID, User> byId = new LinkedHashMap<>();
        if (request.selectAll()) {
            for (User user : userRepository.findAllWithDetails()) {
                putIfEligible(byId, user);
            }
        } else {
            addByRoles(byId, request.roles());
            addByCompanies(byId, request.companyIds());
            addByUserIds(byId, request.userIds());
        }

        if (byId.isEmpty()) {
            throw new BadRequestException("Нет получателей по выбранным фильтрам");
        }
        return new ArrayList<>(byId.values());
    }

    private void addByRoles(Map<UUID, User> byId, List<String> roles) {
        if (roles == null || roles.isEmpty()) {
            return;
        }
        Set<String> normalized = new LinkedHashSet<>();
        for (String role : roles) {
            if (StringUtils.hasText(role)) {
                normalized.add(role.trim().toUpperCase(Locale.ROOT));
            }
        }
        for (String role : normalized) {
            if (RoleName.SUPER_ADMIN.name().equals(role)) {
                continue;
            }
            for (User user : userRepository.findActiveByRoleName(role)) {
                putIfEligible(byId, user);
            }
        }
    }

    private void addByCompanies(Map<UUID, User> byId, List<Integer> companyIds) {
        if (companyIds == null || companyIds.isEmpty()) {
            return;
        }
        Set<Integer> ids = new LinkedHashSet<>(companyIds);
        for (Integer companyId : ids) {
            if (companyId == null) {
                continue;
            }
            for (User user : userRepository.findByCompanyIdWithDetails(companyId)) {
                if (user.isActive()) {
                    putIfEligible(byId, user);
                }
            }
        }
    }

    private void addByUserIds(Map<UUID, User> byId, List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return;
        }
        Set<UUID> ids = new LinkedHashSet<>(userIds);
        List<User> users = userRepository.findAllById(ids);
        if (users.size() != ids.size()) {
            throw new ResourceNotFoundException("One or more users not found");
        }
        for (User user : users) {
            putIfEligible(byId, user);
        }
    }

    private static void putIfEligible(Map<UUID, User> byId, User user) {
        if (user == null || user.getId() == null || !user.isActive()) {
            return;
        }
        if (user.getRole() != null && RoleName.SUPER_ADMIN.name().equals(user.getRole().getName())) {
            return;
        }
        byId.putIfAbsent(user.getId(), user);
    }

    private static boolean hasAudience(SendBroadcastEmailRequest request) {
        if (request.selectAll()) {
            return true;
        }
        return (request.userIds() != null && !request.userIds().isEmpty())
            || (request.roles() != null && !request.roles().isEmpty())
            || (request.companyIds() != null && !request.companyIds().isEmpty());
    }
}
