package com.pos.dto.telegram;

public record TelegramStoreDto(
    Integer storeId,
    String storeName,
    String address,
    String phone,
    String businessType
) {}
