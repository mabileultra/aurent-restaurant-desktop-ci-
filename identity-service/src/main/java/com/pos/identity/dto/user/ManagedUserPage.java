package com.pos.identity.dto.user;

import java.util.List;

public record ManagedUserPage(
    List<ManagedUserResponse> content,
    int totalPages,
    long totalElements,
    int size,
    int number,
    long totalUsers,
    long activeUsers,
    long inactiveUsers,
    long adminUsers,
    long staffUsers,
    long tabTotalUsers,
    long tabActiveUsers,
    long tabInactiveUsers
) {
    public static ManagedUserPage empty(int size, int number) {
        return new ManagedUserPage(List.of(), 0, 0, size, number, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    public static ManagedUserPage of(
        List<ManagedUserResponse> content,
        int totalPages,
        long totalElements,
        int size,
        int number,
        ManagedUserCounts counts
    ) {
        ManagedUserCounts safe = counts == null ? ManagedUserCounts.zero() : counts;
        return new ManagedUserPage(
            content,
            totalPages,
            totalElements,
            size,
            number,
            safe.totalUsers(),
            safe.activeUsers(),
            safe.inactiveUsers(),
            safe.adminUsers(),
            safe.staffUsers(),
            safe.tabTotalUsers(),
            safe.tabActiveUsers(),
            safe.tabInactiveUsers()
        );
    }
}
