package com.pos.restaurant.analytics.support;

import com.pos.restaurant.edge.entity.EdgeStaff;
import com.pos.restaurant.edge.repository.EdgeStaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AnalyticsStaffNameResolver {

    private final EdgeStaffRepository staffRepository;

    public Map<UUID, String> namesByIds(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        Map<UUID, String> names = new HashMap<>();
        for (EdgeStaff staff : staffRepository.findAllById(ids)) {
            names.put(staff.getUserId(), displayName(staff));
        }
        return names;
    }

    private static String displayName(EdgeStaff staff) {
        if (staff.getFullName() != null && !staff.getFullName().isBlank()) {
            return staff.getFullName().trim();
        }
        if (staff.getUsername() != null && !staff.getUsername().isBlank()) {
            return staff.getUsername().trim();
        }
        return null;
    }
}
