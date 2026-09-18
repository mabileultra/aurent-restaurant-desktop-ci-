package com.pos.pharmacy.client.impl;

import com.pos.pharmacy.client.PosCoreMarkingClient;
import com.pos.pharmacy.client.dto.PosMarkingWithdrawRequest;
import com.pos.pharmacy.client.dto.PosMarkingWithdrawResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class PosCoreMarkingClientImpl implements PosCoreMarkingClient {

    private final RestClient posCoreRestClient;

    @Override
    public PosMarkingWithdrawResponse withdraw(PosMarkingWithdrawRequest request) {
        return posCoreRestClient.post()
            .uri("/internal/pharmacy/marking/withdraw")
            .body(request)
            .retrieve()
            .body(PosMarkingWithdrawResponse.class);
    }
}
