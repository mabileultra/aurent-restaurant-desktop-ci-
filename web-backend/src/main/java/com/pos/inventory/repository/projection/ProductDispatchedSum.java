package com.pos.inventory.repository.projection;

import java.util.UUID;

public record ProductDispatchedSum(UUID productId, long dispatched) {}
