package com.pos.reporting.client;

import com.pos.reporting.dto.SaleFactsPageResponse;

import java.time.LocalDate;

public interface PosSaleFactsClient {

    SaleFactsPageResponse fetchPage(LocalDate from, LocalDate to, int page, int size, String authorization);
}
