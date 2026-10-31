package com.pos.shared.api;

import java.time.Instant;

/** Inclusive-start / exclusive-end style window: {@code from <= t < to}. */
public record InstantRange(Instant from, Instant to) {
}
