package com.pos.idempotency.impl;

import com.pos.exception.ConflictException;
import com.pos.exception.UnprocessableEntityException;
import com.pos.idempotency.IdempotencyService;
import com.pos.idempotency.entity.ApiIdempotencyRecord;
import com.pos.idempotency.repository.ApiIdempotencyRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class IdempotencyServiceImpl implements IdempotencyService {

    static final Duration TTL = Duration.ofHours(24);

    private final ApiIdempotencyRepository repository;

    @Override
    @Transactional
    public Optional<ApiIdempotencyRecord> begin(String key, String scope, String requestHash) {
        String normalizedKey = requireKey(key);
        Instant now = Instant.now();
        Optional<ApiIdempotencyRecord> existing = repository.findById(normalizedKey);
        if (existing.isPresent()) {
            ApiIdempotencyRecord row = existing.get();
            if (row.getExpiresAt().isBefore(now)) {
                repository.delete(row);
            } else {
                return Optional.of(validateExisting(row, scope, requestHash));
            }
        }
        ApiIdempotencyRecord created = ApiIdempotencyRecord.builder()
            .idempotencyKey(normalizedKey)
            .scope(scope)
            .requestHash(requestHash)
            .status(ApiIdempotencyRecord.Status.IN_PROGRESS)
            .createdAt(now)
            .expiresAt(now.plus(TTL))
            .build();
        try {
            repository.saveAndFlush(created);
            return Optional.empty();
        } catch (DataIntegrityViolationException ex) {
            ApiIdempotencyRecord raced = repository.findById(normalizedKey)
                .orElseThrow(() -> new ConflictException("Idempotency key is already being processed"));
            return Optional.of(validateExisting(raced, scope, requestHash));
        }
    }

    @Override
    @Transactional
    public void complete(String key, int responseStatus, String responseBody) {
        String normalizedKey = requireKey(key);
        ApiIdempotencyRecord row = repository.findById(normalizedKey).orElse(null);
        if (row == null) {
            return;
        }
        row.setStatus(ApiIdempotencyRecord.Status.COMPLETED);
        row.setResponseStatus(responseStatus);
        row.setResponseBody(responseBody);
        repository.save(row);
    }

    @Override
    @Transactional
    public void abandon(String key) {
        if (!StringUtils.hasText(key)) {
            return;
        }
        repository.findById(key.trim()).ifPresent(row -> {
            if (row.getStatus() == ApiIdempotencyRecord.Status.IN_PROGRESS) {
                repository.delete(row);
            }
        });
    }

    @Override
    @Transactional
    public void purgeExpired() {
        int removed = repository.deleteExpired(Instant.now());
        if (removed > 0) {
            LogUtil.info(IdempotencyServiceImpl.class, "Purged expired idempotency keys: {}", removed);
        }
    }

    private static ApiIdempotencyRecord validateExisting(
        ApiIdempotencyRecord row,
        String scope,
        String requestHash
    ) {
        if (!row.getScope().equals(scope) || !row.getRequestHash().equals(requestHash)) {
            throw new UnprocessableEntityException(
                "X-Idempotency-Key was reused with a different request body"
            );
        }
        if (row.getStatus() == ApiIdempotencyRecord.Status.IN_PROGRESS) {
            throw new ConflictException("Idempotency key is already being processed");
        }
        return row;
    }

    private static String requireKey(String key) {
        if (!StringUtils.hasText(key)) {
            throw new IllegalArgumentException("idempotency key required");
        }
        String trimmed = key.trim();
        if (trimmed.length() > 64) {
            throw new UnprocessableEntityException("X-Idempotency-Key must be at most 64 characters");
        }
        return trimmed;
    }
}
