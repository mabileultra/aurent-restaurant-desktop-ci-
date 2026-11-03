package com.pos.identity.repository;

import com.pos.identity.entity.ModuleAccessHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ModuleAccessHistoryRepository extends JpaRepository<ModuleAccessHistory, UUID> {

    Page<ModuleAccessHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<ModuleAccessHistory> findByTargetUserIdOrderByCreatedAtDesc(UUID targetUserId, Pageable pageable);
}
