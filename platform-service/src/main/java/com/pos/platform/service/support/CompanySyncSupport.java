package com.pos.platform.service.support;

import com.pos.platform.client.PosCoreClient;
import com.pos.platform.client.dto.CompanySyncRequest;
import com.pos.platform.entity.Company;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CompanySyncSupport {

    private final PosCoreClient posCoreClient;

    public void syncCreate(Company company) {
        sync(company, "CREATE");
    }

    public void syncUpdate(Company company) {
        sync(company, "UPDATE");
    }

    public void syncDelete(Company company) {
        sync(company, "DELETE");
    }

    private void sync(Company company, String operation) {
        posCoreClient.syncCompany(new CompanySyncRequest(
            operation,
            company.getId(),
            company.getName(),
            company.getLoginCode(),
            company.getLegalName(),
            company.getTin(),
            company.getAddress(),
            company.getPhone(),
            company.getBusinessType(),
            company.isActive()
        ));
    }
}
