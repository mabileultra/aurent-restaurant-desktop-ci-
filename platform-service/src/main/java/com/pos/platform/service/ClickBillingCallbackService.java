package com.pos.platform.service;

import java.util.Map;

public interface ClickBillingCallbackService {

    Map<String, Object> prepare(Map<String, String> params);

    Map<String, Object> complete(Map<String, String> params);
}
