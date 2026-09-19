package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.warehouse.repository.StockReceiptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * Следующий свободный номер прихода по уже занятым REC-yyyyMMdd-*,
 * а не по количеству документов за день (дырки после удаления и миграция ломают count).
 */
@Component
@RequiredArgsConstructor
public class PharmacyReceiptNumberAllocator {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockReceiptRepository stockReceiptRepository;
    private final PharmacyReceiptNumberFormat format;

    public String next() {
        LocalDate today = LocalDate.now(ZONE);
        String prefix = format.prefix(today);
        List<String> taken = stockReceiptRepository.findReceiptNumbersStartingWith(prefix);
        int max = 0;
        for (String number : taken) {
            max = Math.max(max, format.sequence(number, prefix));
        }
        return format.format(today, max + 1);
    }
}
