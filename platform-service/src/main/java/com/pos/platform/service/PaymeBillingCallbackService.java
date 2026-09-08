package com.pos.platform.service;

import java.util.Map;

public interface PaymeBillingCallbackService {

    Object handle(Map<String, Object> body, String authHeader);
}
