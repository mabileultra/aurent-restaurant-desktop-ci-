package com.pos.identity.dto.user;

public record ManagedUserCounts(
    long totalUsers,
    long activeUsers,
    long inactiveUsers,
    long adminUsers,
    long staffUsers,
    long tabTotalUsers,
    long tabActiveUsers,
    long tabInactiveUsers
) {
    public static ManagedUserCounts zero() {
        return new ManagedUserCounts(0, 0, 0, 0, 0, 0, 0, 0);
    }
}
