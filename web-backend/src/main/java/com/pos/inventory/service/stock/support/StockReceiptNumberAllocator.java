package com.pos.inventory.service.stock.support;

import com.pos.inventory.repository.StockReceiptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * Следующий свободный номер прихода по уже занятым REC-yyyyMMdd-*,
 * а не по count за день (дыры после удаления ломают count → unique conflict).
 */
@Component
@RequiredArgsConstructor
public class StockReceiptNumberAllocator {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockReceiptRepository stockReceiptRepository;
    private final StockReceiptNumberFormat format;

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
