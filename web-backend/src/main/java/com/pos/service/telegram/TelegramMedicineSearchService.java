package com.pos.service.telegram;

import com.pos.dto.telegram.MedicineSearchResponse;

public interface TelegramMedicineSearchService {

    MedicineSearchResponse search(String query);
}
