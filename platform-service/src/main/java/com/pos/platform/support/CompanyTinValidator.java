package com.pos.platform.support;

import com.pos.platform.exception.BadRequestException;
import com.pos.platform.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class CompanyTinValidator {

    private static final String TIN_PATTERN = "\\d{9}";

    private final CompanyRepository companyRepository;

    /**
     * @return normalized TIN (9 digits) or null when blank
     */
    public String normalizeAndValidateUnique(String rawTin, Integer excludeCompanyId) {
        if (!StringUtils.hasText(rawTin)) {
            return null;
        }
        String tin = rawTin.trim();
        if (!tin.matches(TIN_PATTERN)) {
            throw new BadRequestException("STIR 9 ta raqamdan iborat bo'lishi kerak");
        }
        boolean taken = excludeCompanyId == null
            ? companyRepository.existsByTin(tin)
            : companyRepository.existsByTinAndIdNot(tin, excludeCompanyId);
        if (taken) {
            throw new BadRequestException("Bu STIR allaqachon boshqa kompaniyaga biriktirilgan");
        }
        return tin;
    }
}
