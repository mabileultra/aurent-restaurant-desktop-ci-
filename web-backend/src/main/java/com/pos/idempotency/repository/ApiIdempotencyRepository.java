package com.pos.idempotency.repository;

import com.pos.idempotency.entity.ApiIdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface ApiIdempotencyRepository extends JpaRepository<ApiIdempotencyRecord, String> {

    @Modifying
    @Query("DELETE FROM ApiIdempotencyRecord r WHERE r.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);
}
