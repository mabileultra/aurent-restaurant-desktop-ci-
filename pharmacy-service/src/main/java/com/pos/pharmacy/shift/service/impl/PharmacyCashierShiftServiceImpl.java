package com.pos.pharmacy.shift.service.impl;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCommonErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyShiftErrors;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.shift.domain.PharmacyShiftStatus;
import com.pos.pharmacy.shift.dto.ClosePharmacyShiftRequest;
import com.pos.pharmacy.shift.dto.OpenPharmacyShiftRequest;
import com.pos.pharmacy.shift.dto.PharmacyShiftResponse;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import com.pos.pharmacy.shift.repository.PharmacyCashierShiftRepository;
import com.pos.pharmacy.shift.service.PharmacyCashierShiftService;
import com.pos.pharmacy.shift.support.PharmacyShiftLookup;
import com.pos.pharmacy.shift.support.PharmacyShiftResponseAssembler;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PharmacyCashierShiftServiceImpl implements PharmacyCashierShiftService {

    private final PharmacyCashierShiftRepository shiftRepository;
    private final PharmacyShiftLookup shiftLookup;
    private final PharmacyShiftResponseAssembler assembler;

    @Override
    @Transactional(readOnly = true)
    public Optional<PharmacyShiftResponse> findCurrent(Integer storeId) {
        return shiftLookup.findOpen(storeId).map(assembler::toResponse);
    }

    @Override
    @Transactional
    public PharmacyShiftResponse open(Integer storeId, OpenPharmacyShiftRequest request) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        UUID cashierId = PharmacyTenantContext.getUserId();
        if (companyId == null) {
            throw PharmacyErrors.of(PharmacyCommonErrors.PHARM_COMPANY_REQUIRED);
        }
        if (cashierId == null) {
            throw PharmacyErrors.of(PharmacyCommonErrors.PHARM_CASHIER_REQUIRED);
        }
        if (storeId == null) {
            throw PharmacyErrors.of(PharmacyCommonErrors.PHARM_STORE_REQUIRED);
        }
        if (shiftRepository.existsByCashierIdAndStoreIdAndStatus(cashierId, storeId, PharmacyShiftStatus.OPEN)) {
            throw PharmacyErrors.of(PharmacyShiftErrors.PHARM_SHIFT_ALREADY_OPEN);
        }

        OpenPharmacyShiftRequest body = request != null ? request : new OpenPharmacyShiftRequest(null, null, null, null);
        BigDecimal openingCash = body.openingCash() != null ? body.openingCash() : BigDecimal.ZERO;
        if (openingCash.signum() < 0) {
            throw PharmacyErrors.of(PharmacyShiftErrors.PHARM_SHIFT_OPENING_CASH_NEGATIVE);
        }

        PharmacyCashierShift saved = shiftRepository.save(PharmacyCashierShift.builder()
            .companyId(companyId)
            .storeId(storeId)
            .storeName(blankToNull(body.storeName()))
            .cashierId(cashierId)
            .cashierName(blankToNull(body.cashierName()))
            .status(PharmacyShiftStatus.OPEN)
            .openingCash(openingCash)
            .comment(blankToNull(body.comment()))
            .build());

        LogUtil.info(
            PharmacyCashierShiftServiceImpl.class,
            "Pharmacy shift opened: id={}, storeId={}, cashierId={}",
            saved.getId(),
            storeId,
            cashierId
        );
        return assembler.toResponse(saved);
    }

    @Override
    @Transactional
    public PharmacyShiftResponse close(UUID shiftId, ClosePharmacyShiftRequest request) {
        PharmacyCashierShift shift = shiftLookup.require(shiftId);
        if (shift.getStatus() != PharmacyShiftStatus.OPEN) {
            throw PharmacyErrors.of(PharmacyShiftErrors.PHARM_SHIFT_ALREADY_CLOSED);
        }
        UUID cashierId = PharmacyTenantContext.getUserId();
        if (cashierId != null && !cashierId.equals(shift.getCashierId())) {
            throw PharmacyErrors.of(PharmacyShiftErrors.PHARM_SHIFT_CLOSE_FORBIDDEN);
        }

        ClosePharmacyShiftRequest body = request != null ? request : new ClosePharmacyShiftRequest(null, null);
        shift.setStatus(PharmacyShiftStatus.CLOSED);
        shift.setClosedAt(Instant.now());
        if (body.closingCash() != null) {
            if (body.closingCash().signum() < 0) {
                throw PharmacyErrors.of(PharmacyShiftErrors.PHARM_SHIFT_CLOSING_CASH_NEGATIVE);
            }
            shift.setClosingCash(body.closingCash());
        }
        if (body.comment() != null && !body.comment().isBlank()) {
            shift.setComment(body.comment().trim());
        }

        LogUtil.info(
            PharmacyCashierShiftServiceImpl.class,
            "Pharmacy shift closed: id={}, storeId={}",
            shift.getId(),
            shift.getStoreId()
        );
        return assembler.toResponse(shift);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
