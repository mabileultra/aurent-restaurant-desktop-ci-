package com.pos.identity.repository;

import com.pos.identity.entity.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuthSessionRepository extends JpaRepository<AuthSession, UUID> {

    Optional<AuthSession> findByIdAndRevokedAtIsNull(UUID id);

    List<AuthSession> findByUserIdAndRevokedAtIsNullOrderByLastSeenAtDesc(UUID userId);

    List<AuthSession> findByUserIdInAndRevokedAtIsNullOrderByLastSeenAtDesc(Collection<UUID> userIds);

    long countByUserIdAndRevokedAtIsNull(UUID userId);

    @Modifying
    @Query("""
        UPDATE AuthSession s
        SET s.revokedAt = :now
        WHERE s.userId = :userId
          AND s.revokedAt IS NULL
          AND (:keepId IS NULL OR s.id <> :keepId)
        """)
    int revokeOthers(@Param("userId") UUID userId, @Param("keepId") UUID keepId, @Param("now") Instant now);

    @Modifying
    @Query("""
        UPDATE AuthSession s
        SET s.lastSeenAt = :now
        WHERE s.id = :id AND s.revokedAt IS NULL
        """)
    int touch(@Param("id") UUID id, @Param("now") Instant now);
}
