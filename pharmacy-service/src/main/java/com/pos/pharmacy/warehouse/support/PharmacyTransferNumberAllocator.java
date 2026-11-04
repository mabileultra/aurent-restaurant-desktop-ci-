package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.warehouse.repository.StockTransferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PharmacyTransferNumberAllocator {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockTransferRepository stockTransferRepository;
    private final PharmacyTransferNumberFormat format;

    public String next() {
        LocalDate today = LocalDate.now(ZONE);
        String prefix = format.prefix(today);
        List<String> taken = stockTransferRepository.findTransferNumbersStartingWith(prefix);
        int max = 0;
        for (String number : taken) {
            max = Math.max(max, format.sequence(number, prefix));
        }
        return format.format(today, max + 1);
    }
}
