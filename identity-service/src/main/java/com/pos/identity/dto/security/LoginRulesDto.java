package com.pos.identity.dto.security;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

public record LoginRulesDto(
    Map<String, Boolean> tfa,
    String method,
    int minLen,
    int expiry,
    Map<String, Boolean> req,
    int idle,
    int maxH,
    int conc,
    @JsonProperty("notify") boolean notifyOn,
    int attempts,
    int lockMin,
    boolean ipOn,
    List<IpAllowEntry> ips
) {
    public record IpAllowEntry(String addr, String note, Boolean mine) {}
}
