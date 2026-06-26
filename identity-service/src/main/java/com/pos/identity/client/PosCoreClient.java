package com.pos.identity.client;

import com.pos.identity.client.dto.AuditRequest;
import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.client.dto.StoreValidateRequest;
import com.pos.identity.client.dto.StoreValidateResponse;
import com.pos.identity.client.dto.SuperAdminLoginEmailRequest;
import com.pos.identity.client.dto.UserCredentialsEmailRequest;
import com.pos.identity.client.dto.UserSyncRequest;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class PosCoreClient {

    private final RestClient posCoreRestClient;

    public CompanyDto getCompanyByLoginCode(String loginCode) {
        return posCoreRestClient.get()
            .uri("/internal/identity/companies/by-login-code/{code}", loginCode)
            .retrieve()
            .onStatus(HttpStatusCode::isError, (req, res) -> {
                throw new BadRequestException("Invalid company code");
            })
            .body(CompanyDto.class);
    }

    public CompanyDto getCompanyById(Integer id) {
        return posCoreRestClient.get()
            .uri("/internal/identity/companies/{id}", id)
            .retrieve()
            .onStatus(HttpStatusCode::isError, (req, res) -> {
                throw new BadRequestException("Company not found");
            })
            .body(CompanyDto.class);
    }

    public void syncUser(UserSyncRequest request) {
        postVoid("/internal/identity/users/sync", request);
    }

    public void audit(AuditRequest request) {
        postVoid("/internal/identity/audit", request);
    }

    public void notifySuperAdminLogin(SuperAdminLoginEmailRequest request) {
        postVoid("/internal/identity/email/super-admin-login", request);
    }

    public void sendUserCredentials(UserCredentialsEmailRequest request) {
        postVoid("/internal/identity/email/user-credentials", request);
    }

    public StoreValidateResponse validateStores(StoreValidateRequest request) {
        return posCoreRestClient.post()
            .uri("/internal/identity/stores/validate")
            .body(request)
            .retrieve()
            .onStatus(HttpStatusCode::isError, (req, res) -> {
                throw new BadRequestException("Store validation failed");
            })
            .body(StoreValidateResponse.class);
    }

    private void postVoid(String path, Object body) {
        try {
            posCoreRestClient.post()
                .uri(path)
                .body(body)
                .retrieve()
                .toBodilessEntity();
        } catch (Exception ex) {
            LogUtil.warn(PosCoreClient.class, "POS core call failed: path={}, error={}", path, ex.getMessage());
        }
    }
}
