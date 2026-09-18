package com.pos.integrations.pharmacy.service;

import com.pos.integrations.pharmacy.dto.MarkingWithdrawRequest;
import com.pos.integrations.pharmacy.dto.MarkingWithdrawResponse;

public interface PharmacyMarkingWithdrawService {

  MarkingWithdrawResponse withdraw(MarkingWithdrawRequest request);
}
