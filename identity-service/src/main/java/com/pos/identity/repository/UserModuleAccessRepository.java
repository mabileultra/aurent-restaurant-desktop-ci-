package com.pos.identity.repository;

import com.pos.identity.entity.UserModuleAccess;
import com.pos.identity.entity.UserModuleAccessId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UserModuleAccessRepository extends JpaRepository<UserModuleAccess, UserModuleAccessId> {

    List<UserModuleAccess> findByIdUserId(UUID userId);

    @Modifying
    @Query("DELETE FROM UserModuleAccess uma WHERE uma.id.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
