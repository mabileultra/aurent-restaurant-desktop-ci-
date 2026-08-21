package com.pos.platform.service;

import com.pos.platform.dto.company.CompanyResponse;
import com.pos.platform.dto.company.CreateCompanyRequest;
import com.pos.platform.dto.company.UpdateCompanyRequest;
import com.pos.platform.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CompanyService {

    PageResponse<CompanyResponse> list(String search, String businessType, Pageable pageable);

    List<CompanyResponse> listAll();

    CompanyResponse getById(Integer id);

    CompanyResponse create(CreateCompanyRequest request);

    CompanyResponse update(Integer id, UpdateCompanyRequest request);

    void delete(Integer id);
}
