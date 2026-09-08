package com.pos.platform.service;

import com.pos.platform.domain.BillingTopUpStatus;
import com.pos.platform.dto.billing.BillingTopUpResponse;
import com.pos.platform.dto.billing.ReviewTopUpRequest;
import com.pos.platform.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.UUID;

public interface BillingTopUpService {

    PageResponse<BillingTopUpResponse> list(BillingTopUpStatus status, Pageable pageable);

    PageResponse<BillingTopUpResponse> listForCompany(Integer companyId, Pageable pageable);

    BillingTopUpResponse submit(Integer companyId, BigDecimal amount, String comment, MultipartFile receipt);

    BillingTopUpResponse approve(UUID requestId, ReviewTopUpRequest request);

    BillingTopUpResponse reject(UUID requestId, ReviewTopUpRequest request);

    long countPending();
}
