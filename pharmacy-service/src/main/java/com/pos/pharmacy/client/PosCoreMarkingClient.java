package com.pos.pharmacy.client;

import com.pos.pharmacy.client.dto.PosMarkingWithdrawRequest;
import com.pos.pharmacy.client.dto.PosMarkingWithdrawResponse;

public interface PosCoreMarkingClient {

    PosMarkingWithdrawResponse withdraw(PosMarkingWithdrawRequest request);
}
