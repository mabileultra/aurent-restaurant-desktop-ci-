package com.pos.platform.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;

public interface PosCoreProxyService {

    ResponseEntity<byte[]> forward(HttpServletRequest request, String publicPrefix, String opsBase);
}
