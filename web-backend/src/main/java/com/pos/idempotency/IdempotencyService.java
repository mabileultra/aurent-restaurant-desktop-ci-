package com.pos.idempotency;

import com.pos.idempotency.entity.ApiIdempotencyRecord;

import java.util.Optional;

public interface IdempotencyService {

    /**
     * Begin processing a key. Empty → proceed with fresh claim.
     * Present COMPLETED → replay or 422; IN_PROGRESS → 409.
     */
    Optional<ApiIdempotencyRecord> begin(String key, String scope, String requestHash);

    void complete(String key, int responseStatus, String responseBody);

    void abandon(String key);

    void purgeExpired();
}
