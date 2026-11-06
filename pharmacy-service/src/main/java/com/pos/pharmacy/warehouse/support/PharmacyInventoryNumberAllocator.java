package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.warehouse.repository.StockInventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PharmacyInventoryNumberAllocator {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockInventoryRepository stockInventoryRepository;
    private final PharmacyInventoryNumberFormat format;

    public String next() {
        LocalDate today = LocalDate.now(ZONE);
        String prefix = format.prefix(today);
        List<String> taken = stockInventoryRepository.findInventoryNumbersStartingWith(prefix);
        int max = 0;
        for (String number : taken) {
            max = Math.max(max, format.sequence(number, prefix));
        }
        return format.format(today, max + 1);
    }
}
