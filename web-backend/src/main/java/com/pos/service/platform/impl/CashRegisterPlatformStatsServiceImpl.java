package com.pos.service.platform.impl;

import com.pos.dto.platform.internal.CashRegisterStatsResponse;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.service.platform.CashRegisterPlatformStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CashRegisterPlatformStatsServiceImpl implements CashRegisterPlatformStatsService {

    /** Registers seen within this window count as online. */
    private static final long ONLINE_WINDOW_MINUTES = 5;

    private final CashRegisterRepository cashRegisterRepository;

    @Override
    public CashRegisterStatsResponse stats() {
        long total = cashRegisterRepository.count();
        long active = cashRegisterRepository.countByStatusIgnoreCase("ACTIVE");
        long inactive = Math.max(0, total - active);
        Instant since = Instant.now().minus(ONLINE_WINDOW_MINUTES, ChronoUnit.MINUTES);
        long online = cashRegisterRepository.countByLastSeenAtAfter(since);
        return new CashRegisterStatsResponse(total, active, inactive, online);
    }
}
