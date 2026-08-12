package com.pos.telegram.service;

import com.pos.telegram.dto.CompanyTelegramBotResponse;
import com.pos.telegram.dto.TelegramBotRuntimeInstanceDto;
import com.pos.telegram.dto.UpsertCompanyTelegramBotRequest;

import java.util.List;

public interface CompanyTelegramBotService {

    CompanyTelegramBotResponse getForCurrentCompany();

    CompanyTelegramBotResponse upsertForCurrentCompany(UpsertCompanyTelegramBotRequest request);

    List<TelegramBotRuntimeInstanceDto> listRuntimeInstances();
}
