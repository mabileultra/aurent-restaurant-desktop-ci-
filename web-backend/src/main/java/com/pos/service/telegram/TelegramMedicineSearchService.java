package com.pos.service.telegram;

import com.pos.dto.telegram.MedicineSearchItemDto;
import com.pos.dto.telegram.MedicineSearchResponse;
import com.pos.dto.telegram.TelegramStoreDto;

import java.util.List;
import java.util.UUID;

public interface TelegramMedicineSearchService {

    MedicineSearchResponse search(String query);

    MedicineSearchItemDto getProductAvailability(UUID productId);

    List<TelegramStoreDto> listActiveStores();
}
