package com.pos.platform.service.impl;

import com.pos.platform.client.PosCoreClient;
import com.pos.platform.domain.BusinessTypeCodes;
import com.pos.platform.dto.company.CompanyResponse;
import com.pos.platform.dto.company.CreateCompanyRequest;
import com.pos.platform.dto.company.UpdateCompanyRequest;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.entity.Company;
import com.pos.platform.exception.BadRequestException;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.mapper.CompanyMapper;
import com.pos.platform.repository.CompanyRepository;
import com.pos.platform.repository.spec.CompanySpecifications;
import com.pos.platform.service.CompanyService;
import com.pos.platform.service.support.CompanySyncSupport;
import com.pos.platform.service.support.GeoLocationSupport;
import com.pos.platform.util.BusinessTypeParser;
import com.pos.platform.util.CompanyLoginCodeUtil;
import com.pos.shared.log.LogUtil;
import com.pos.platform.util.TextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyServiceImpl implements CompanyService {

    private static final int LOGIN_CODE_RANDOM_ATTEMPTS = 100;

    private final CompanyRepository companyRepository;
    private final CompanyMapper companyMapper;
    private final CompanySyncSupport companySyncSupport;
    private final GeoLocationSupport geoLocationSupport;
    private final PosCoreClient posCoreClient;

    @Override
    public PageResponse<CompanyResponse> list(
        String search,
        String businessType,
        String regionCode,
        String districtCode,
        Pageable pageable
    ) {
        Pageable sorted = PageRequest.of(
            pageable.getPageNumber(),
            pageable.getPageSize(),
            pageable.getSort().isSorted() ? pageable.getSort() : Sort.by("name").ascending()
        );
        Page<Company> page = companyRepository.findAll(
            CompanySpecifications.filter(search, businessType, regionCode, districtCode),
            sorted
        );
        Map<Integer, Integer> storeCounts = posCoreClient.getStoreCountsOrEmpty(
            page.getContent().stream().map(Company::getId).toList()
        );
        return PageResponse.from(page.map(company -> toListResponse(company, storeCounts)));
    }

    @Override
    public List<CompanyResponse> listAll() {
        List<Company> companies = companyRepository.findAll(Sort.by("name").ascending());
        Map<Integer, Integer> storeCounts = posCoreClient.getStoreCountsOrEmpty(
            companies.stream().map(Company::getId).toList()
        );
        return companies.stream().map(company -> toListResponse(company, storeCounts)).toList();
    }

    @Override
    public CompanyResponse getById(Integer id) {
        return toResponse(requireCompany(id));
    }

    @Override
    @Transactional
    public CompanyResponse create(CreateCompanyRequest request) {
        String name = request.name().trim();
        if (companyRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Company name already exists");
        }
        String loginCode = allocateNextLoginCode(null);
        String regionCode = geoLocationSupport.requireRegionCode(request.regionCode());
        String districtCode = geoLocationSupport.requireDistrictCode(regionCode, request.districtCode());
        Company company = Company.builder()
            .name(name)
            .loginCode(loginCode)
            .legalName(TextUtil.trimOrNull(request.legalName()))
            .tin(TextUtil.trimOrNull(request.tin()))
            .address(TextUtil.trimOrNull(request.address()))
            .regionCode(regionCode)
            .districtCode(districtCode)
            .phone(TextUtil.trimOrNull(request.phone()))
            .businessType(BusinessTypeParser.parseOrDefault(request.businessType(), BusinessTypeCodes.UNIVERSAL))
            .active(request.active() == null || request.active())
            .build();
        Company saved = companyRepository.save(company);
        companySyncSupport.syncCreate(saved);
        LogUtil.info(CompanyServiceImpl.class, "Company created: id={}, name={}", saved.getId(), saved.getName());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public CompanyResponse update(Integer id, UpdateCompanyRequest request) {
        Company company = requireCompany(id);
        if (request.name() != null) {
            String name = request.name().trim();
            if (companyRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
                throw new BadRequestException("Company name already exists");
            }
            company.setName(name);
        }
        if (request.legalName() != null) company.setLegalName(TextUtil.trimOrNull(request.legalName()));
        if (request.tin() != null) company.setTin(TextUtil.trimOrNull(request.tin()));
        if (request.address() != null) company.setAddress(TextUtil.trimOrNull(request.address()));
        if (request.phone() != null) company.setPhone(TextUtil.trimOrNull(request.phone()));
        if (request.businessType() != null) {
            company.setBusinessType(BusinessTypeParser.parseRequired(request.businessType()));
        }
        if (request.active() != null) company.setActive(request.active());
        GeoLocationSupport.GeoCodes geo = geoLocationSupport.resolveForUpdate(
            company.getRegionCode(),
            company.getDistrictCode(),
            request.regionCode(),
            request.districtCode()
        );
        company.setRegionCode(geo.regionCode());
        company.setDistrictCode(geo.districtCode());
        Company saved = companyRepository.save(company);
        companySyncSupport.syncUpdate(saved);
        LogUtil.info(CompanyServiceImpl.class, "Company updated: id={}", id);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        Company company = requireCompany(id);
        int storeCount = posCoreClient.getStoreCount(id);
        if (storeCount > 0) {
            throw new BadRequestException(
                "Нельзя удалить компанию: привязано магазинов — "
                    + storeCount
                    + ". Сначала удалите или отвяжите магазины (Платформа → Магазины), затем повторите."
            );
        }
        companyRepository.delete(company);
        companySyncSupport.syncDelete(company);
        LogUtil.info(CompanyServiceImpl.class, "Company deleted: id={}", id);
    }

    private Company requireCompany(Integer id) {
        return companyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private CompanyResponse toListResponse(Company company, Map<Integer, Integer> storeCounts) {
        return companyMapper.toResponse(company, storeCounts.getOrDefault(company.getId(), 0));
    }

    private CompanyResponse toResponse(Company company) {
        return companyMapper.toResponse(company, posCoreClient.getStoreCountOrZero(company.getId()));
    }

    private String allocateNextLoginCode(Integer excludeId) {
        for (int attempt = 0; attempt < LOGIN_CODE_RANDOM_ATTEMPTS; attempt++) {
            String code = CompanyLoginCodeUtil.format(CompanyLoginCodeUtil.randomValue());
            if (!isLoginCodeTaken(code, excludeId)) {
                return code;
            }
        }
        for (int candidate = CompanyLoginCodeUtil.MIN_CODE; candidate <= CompanyLoginCodeUtil.MAX_CODE; candidate++) {
            String code = CompanyLoginCodeUtil.format(candidate);
            if (!isLoginCodeTaken(code, excludeId)) {
                return code;
            }
        }
        throw new BadRequestException("Нет свободных кодов входа (диапазон исчерпан)");
    }

    private boolean isLoginCodeTaken(String code, Integer excludeId) {
        return excludeId == null
            ? companyRepository.existsByLoginCodeIgnoreCase(code)
            : companyRepository.existsByLoginCodeIgnoreCaseAndIdNot(code, excludeId);
    }
}
