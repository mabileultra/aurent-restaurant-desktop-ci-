package com.pos.telegram.dto;

public record TelegramStoreDto(
    Integer storeId,
    String storeName,
    String address,
    String phone,
    String businessType
) {}
