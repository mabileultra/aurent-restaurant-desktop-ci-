package com.pos.platform.client;

import com.pos.platform.client.dto.CompanyStoreCountResponse;
import com.pos.platform.client.dto.CompanySyncRequest;
import com.pos.platform.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class PosCoreClient {

    private final RestClient posCoreRestClient;

    public void syncCompany(CompanySyncRequest request) {
        try {
            posCoreRestClient.post()
                .uri("/internal/platform/companies/sync")
                .body(request)
                .retrieve()
                .toBodilessEntity();
        } catch (Exception ex) {
            LogUtil.warn(PosCoreClient.class, "Company sync to POS core failed: id={}, op={}", request.id(), request.operation());
        }
    }

    public int getStoreCount(Integer companyId) {
        CompanyStoreCountResponse response = posCoreRestClient.get()
            .uri("/internal/platform/companies/{id}/store-count", companyId)
            .retrieve()
            .body(CompanyStoreCountResponse.class);
        return response != null ? response.storeCount() : 0;
    }
}
