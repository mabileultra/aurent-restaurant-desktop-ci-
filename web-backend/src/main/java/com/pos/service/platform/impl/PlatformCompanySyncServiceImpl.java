package com.pos.service.platform.impl;

import com.pos.domain.businessconfig.BusinessTypeCodes;
import com.pos.dto.platform.internal.CompanySyncRequest;
import com.pos.entity.Company;
import com.pos.repository.CompanyRepository;
import com.pos.service.CompanyBusinessTypeAssignmentService;
import com.pos.service.platform.PlatformCompanySyncService;
import com.pos.util.BusinessTypeParser;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlatformCompanySyncServiceImpl implements PlatformCompanySyncService {

    private final CompanyRepository companyRepository;
    private final JdbcTemplate jdbcTemplate;
    private final CompanyBusinessTypeAssignmentService companyBusinessTypeAssignmentService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void sync(CompanySyncRequest request) {
        if (request == null || request.id() == null) {
            return;
        }
        if ("DELETE".equalsIgnoreCase(request.operation())) {
            companyRepository.findById(request.id()).ifPresent(companyRepository::delete);
            return;
        }
        upsert(request);
    }

    private void upsert(CompanySyncRequest request) {
        String businessType = BusinessTypeParser.parseOrDefault(request.businessType(), BusinessTypeCodes.UNIVERSAL);
        Company company = companyRepository.findById(request.id())
            .orElseGet(() -> Company.builder().id(request.id()).build());
        company.setName(request.name());
        company.setLoginCode(request.loginCode());
        company.setLegalName(request.legalName());
        company.setTin(request.tin());
        company.setAddress(request.address());
        company.setPhone(request.phone());
        company.setBusinessType(businessType);
        company.setActive(request.active());
        companyRepository.save(company);
        companyBusinessTypeAssignmentService.syncFromLegacyType(request.id(), businessType);
        bumpCompanySequence(request.id());
        LogUtil.info(PlatformCompanySyncServiceImpl.class, "Company synced from platform: id={}", request.id());
    }

    private void bumpCompanySequence(Integer companyId) {
        jdbcTemplate.execute(
            "SELECT setval(pg_get_serial_sequence('companies', 'id'), GREATEST("
                + companyId
                + ", COALESCE((SELECT MAX(id) FROM companies), 1)))"
        );
    }
}
