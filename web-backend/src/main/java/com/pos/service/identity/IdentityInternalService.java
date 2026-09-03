package com.pos.service.identity;

import com.pos.dto.identity.internal.CompanyRefDto;
import com.pos.dto.identity.internal.IdentityAuditRequest;
import com.pos.dto.identity.internal.StoreValidateRequest;
import com.pos.dto.identity.internal.StoreValidateResponse;
import com.pos.dto.identity.internal.SuperAdminLoginEmailRequest;
import com.pos.dto.identity.internal.UserCredentialsEmailRequest;
import com.pos.dto.identity.internal.UserSyncRequest;
import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.repository.CompanyRepository;
import com.pos.repository.UserRepository;
import com.pos.service.AuditService;
import com.pos.service.email.EmailService;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IdentityInternalService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final TenantAccessSupport tenantAccess;
    private final IdentityUserSyncService identityUserSyncService;
    private final AuditService auditService;
    private final EmailService emailService;

    public CompanyRefDto companyByLoginCode(String loginCode) {
        Company company = companyRepository.findByLoginCodeIgnoreCase(loginCode)
            .orElseThrow(() -> PosExceptions.notFound("Company", loginCode));
        return toCompanyRef(company);
    }

    public CompanyRefDto companyById(Integer id) {
        Company company = companyRepository.findById(id)
            .orElseThrow(() -> PosExceptions.notFound("Company", id));
        return toCompanyRef(company);
    }

    private static CompanyRefDto toCompanyRef(Company company) {
        return new CompanyRefDto(
            company.getId(),
            company.getName(),
            company.getLoginCode(),
            company.isActive(),
            company.getBusinessType()
        );
    }

    @Transactional(rollbackFor = Exception.class)
    public void syncUser(UserSyncRequest request) {
        identityUserSyncService.sync(request);
    }

    @Transactional(rollbackFor = Exception.class)
    public void audit(IdentityAuditRequest request) {
        if (request.userId() == null) {
            return;
        }
        User user = userRepository.findById(UUID.fromString(request.userId())).orElse(null);
        if (user == null) {
            return;
        }
        auditService.log(user, request.action(), request.entityType(), request.entityId(), request.oldValue(), request.newValue());
    }

    public void notifySuperAdminLogin(SuperAdminLoginEmailRequest request) {
        if (request.userId() == null) {
            return;
        }
        User user = userRepository.findById(UUID.fromString(request.userId())).orElse(null);
        if (user == null) {
            return;
        }
        emailService.notifySuperAdminLogin(user, request.clientIp(), request.userAgent());
    }

    public void sendUserCredentials(UserCredentialsEmailRequest request) {
        User user = userRepository.findById(request.id()).orElse(null);
        if (user == null) {
            return;
        }
        emailService.sendUserCredentials(user, request.plainPassword());
    }

    public StoreValidateResponse validateStores(StoreValidateRequest request) {
        Set<Store> stores = tenantAccess.resolveStoresForUser(request.companyId(), request.storeIds());
        List<Integer> ids = stores.stream().map(Store::getId).sorted().collect(Collectors.toList());
        return new StoreValidateResponse(!ids.isEmpty(), ids);
    }
}
