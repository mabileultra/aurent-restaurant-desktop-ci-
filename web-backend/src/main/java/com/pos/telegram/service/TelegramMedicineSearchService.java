package com.pos.telegram.service;

import com.pos.telegram.dto.MedicineSearchItemDto;
import com.pos.telegram.dto.MedicineSearchResponse;
import com.pos.telegram.dto.TelegramStoreDto;

import java.util.List;
import java.util.UUID;

public interface TelegramMedicineSearchService {

    MedicineSearchResponse search(String query);

    MedicineSearchItemDto getProductAvailability(UUID productId);

    List<TelegramStoreDto> listActiveStores();
}
