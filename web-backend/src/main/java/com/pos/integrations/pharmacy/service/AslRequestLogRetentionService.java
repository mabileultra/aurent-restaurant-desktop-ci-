package com.pos.integrations.pharmacy.service;

public interface AslRequestLogRetentionService {

  int purgeExpired();
}
