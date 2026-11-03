package com.pos.restaurant.edge.dto;

import java.util.List;

/** Desktop → cloud hall reachability + LAN URLs for phone failover. */
public record HallPresenceHeartbeatRequest(
    Integer companyId,
    List<Integer> storeIds,
    Boolean cloudOnline,
    List<String> lanHubUrls
) {
}
