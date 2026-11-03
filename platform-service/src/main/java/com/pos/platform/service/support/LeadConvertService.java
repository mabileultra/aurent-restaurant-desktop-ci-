package com.pos.platform.service.support;

import com.pos.platform.client.IdentityClient;
import com.pos.platform.client.PosCoreClient;
import com.pos.platform.client.dto.CreatePosStoreRequest;
import com.pos.platform.client.dto.IdentityUserResponse;
import com.pos.platform.client.dto.PosStoreResponse;
import com.pos.platform.client.dto.ProvisionIdentityUserRequest;
import com.pos.platform.domain.SiteLeadStatus;
import com.pos.platform.dto.company.CompanyResponse;
import com.pos.platform.dto.company.CreateCompanyRequest;
import com.pos.platform.dto.site.ConvertLeadRequest;
import com.pos.platform.dto.site.ConvertLeadResponse;
import com.pos.platform.entity.SiteLead;
import com.pos.platform.exception.BadRequestException;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.repository.SiteLeadRepository;
import com.pos.platform.service.CompanyService;
import com.pos.platform.support.LeadActorName;
import com.pos.platform.util.TextUtil;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeadConvertService {

    private final SiteLeadRepository siteLeadRepository;
    private final CompanyService companyService;
    private final PosCoreClient posCoreClient;
    private final IdentityClient identityClient;
    private final LeadConvertPersistence leadConvertPersistence;

    public ConvertLeadResponse convert(UUID leadId, ConvertLeadRequest request) {
        SiteLead lead = siteLeadRepository.findById(leadId)
            .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        if (lead.getStatus() == SiteLeadStatus.DONE || lead.getCompanyId() != null) {
            throw new BadRequestException("Ushbu ariza allaqachon kompaniyaga aylantirilgan");
        }

        String author = LeadActorName.current();
        String branchName = StringUtils.hasText(request.branchName()) ? request.branchName().trim() : "Asosiy filial";
        CompanyResponse company = null;
        Integer storeId = null;
        UUID adminUserId = null;
        String adminPassword = null;
        try {
            company = companyService.create(new CreateCompanyRequest(
                request.companyName(),
                null,
                request.legalName(),
                request.tin(),
                null,
                request.regionCode(),
                request.districtCode(),
                firstNonBlank(request.phone(), lead.getPhone()),
                request.businessType(),
                true
            ));
            PosStoreResponse store = posCoreClient.createStore(new CreatePosStoreRequest(
                branchName,
                request.regionCode(),
                request.districtCode(),
                firstNonBlank(request.phone(), lead.getPhone()),
                company.id(),
                request.businessType(),
                true
            ));
            if (store == null || store.id() == null) {
                throw new BadRequestException("Filial yaratilmadi");
            }
            storeId = store.id();

            boolean createAdmin = request.createAdmin();
            String adminUsername = null;
            if (createAdmin) {
                adminPassword = StringUtils.hasText(request.adminPassword())
                    ? request.adminPassword().trim()
                    : UUID.randomUUID() + "Aa1!";
                String email = firstNonBlank(request.adminEmail(), lead.getEmail());
                if (!StringUtils.hasText(email)) {
                    throw new BadRequestException("Admin uchun email kiritilmadi");
                }
                if (!StringUtils.hasText(request.adminLogin())) {
                    throw new BadRequestException("Admin login kiritilmadi");
                }
                IdentityUserResponse admin = identityClient.provisionAdmin(new ProvisionIdentityUserRequest(
                    company.id(),
                    request.adminLogin().trim(),
                    email.trim(),
                    adminPassword,
                    firstNonBlank(request.adminName(), lead.getName()),
                    null,
                    List.of(storeId)
                ));
                if (admin == null || admin.id() == null) {
                    throw new BadRequestException("Admin yaratilmadi");
                }
                adminUserId = admin.id();
                adminUsername = admin.username();
            }

            leadConvertPersistence.markConverted(lead.getId(), company.id(), request.markDone(), author, company.name());
            LogUtil.info(LeadConvertService.class, "Lead converted: leadId={}, companyId={}", leadId, company.id());
            return new ConvertLeadResponse(
                company.id(),
                company.name(),
                company.loginCode(),
                storeId,
                adminUserId,
                adminUserId != null,
                adminUsername,
                adminUserId != null ? adminPassword : null,
                request.markDone() ? SiteLeadStatus.DONE : SiteLeadStatus.IN_PROGRESS
            );
        } catch (RestClientResponseException ex) {
            compensate(company, storeId, adminUserId);
            throw new BadRequestException(extractRemoteMessage(ex));
        } catch (RuntimeException ex) {
            compensate(company, storeId, adminUserId);
            throw ex;
        }
    }

    private void compensate(CompanyResponse company, Integer storeId, UUID adminUserId) {
        identityClient.deleteUser(adminUserId);
        posCoreClient.deleteStore(storeId);
        if (company != null && company.id() != null) {
            try {
                companyService.delete(company.id());
            } catch (Exception ex) {
                LogUtil.warn(LeadConvertService.class, "Company compensate delete failed: id={}", company.id());
            }
        }
    }

    private static String firstNonBlank(String a, String b) {
        if (StringUtils.hasText(a)) {
            return a.trim();
        }
        return TextUtil.trimOrNull(b);
    }

    private static String extractRemoteMessage(RestClientResponseException ex) {
        String body = ex.getResponseBodyAsString();
        if (StringUtils.hasText(body) && body.length() < 500) {
            return body;
        }
        return "Convert failed: " + ex.getStatusCode();
    }
}
