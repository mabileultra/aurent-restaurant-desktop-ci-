package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.sales.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class SaleReceiptNumberGenerator {

    private final SaleRepository saleRepository;

    public String next() {
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String prefix = "PHR-" + date + "-";
        long seq = saleRepository.countByReceiptNumberStartingWith(prefix);
        return prefix + String.format("%04d", seq + 1);
    }
}
