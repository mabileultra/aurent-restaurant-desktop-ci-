package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.dto.HallPresenceHeartbeatRequest;

import java.util.Map;

public interface HallPresenceService {

    Map<String, Object> heartbeat(HallPresenceHeartbeatRequest request);

    Map<String, Object> statusForStore(Integer storeId);
}
