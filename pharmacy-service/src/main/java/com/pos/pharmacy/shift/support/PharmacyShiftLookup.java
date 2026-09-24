package com.pos.pharmacy.shift.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyShiftErrors;
import com.pos.pharmacy.integration.dto.CashierShiftSnapshot;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.shift.domain.PharmacyShiftStatus;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import com.pos.pharmacy.shift.repository.PharmacyCashierShiftRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PharmacyShiftLookup {

    private final PharmacyCashierShiftRepository shiftRepository;

    public Optional<PharmacyCashierShift> findOpen(Integer storeId) {
        UUID cashierId = PharmacyTenantContext.getUserId();
        if (cashierId == null || storeId == null) {
            return Optional.empty();
        }
        return shiftRepository
            .findByCashierIdAndStoreIdAndStatus(cashierId, storeId, PharmacyShiftStatus.OPEN)
            .flatMap(this::forCurrentCompany);
    }

    /**
     * Wrong-company OPEN rows must not 500 the current-shift endpoint — that leaves the POS
     * showing «Open shift» while POST /open still hits exists() → «already open».
     */
    private Optional<PharmacyCashierShift> forCurrentCompany(PharmacyCashierShift shift) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        if (companyId != null && !companyId.equals(shift.getCompanyId())) {
            LogUtil.warn(
                PharmacyShiftLookup.class,
                "Ignoring pharmacy OPEN shift for other company: shiftId={}, shiftCompanyId={}, jwtCompanyId={}, cashierId={}",
                shift.getId(),
                shift.getCompanyId(),
                companyId,
                shift.getCashierId()
            );
            return Optional.empty();
        }
        return Optional.of(shift);
    }

    public PharmacyCashierShift requireOpen(Integer storeId) {
        return findOpen(storeId)
            .orElseThrow(() -> PharmacyErrors.of(PharmacyShiftErrors.PHARM_SHIFT_NOT_OPEN));
    }

    public PharmacyCashierShift require(UUID shiftId) {
        PharmacyCashierShift shift = shiftRepository.findById(shiftId)
            .orElseThrow(() -> PharmacyErrors.notFound(PharmacyShiftErrors.PHARM_SHIFT_NOT_FOUND, shiftId));
        return assertCompany(shift);
    }

    public CashierShiftSnapshot toSnapshot(PharmacyCashierShift shift) {
        if (shift == null) {
            return null;
        }
        return new CashierShiftSnapshot(
            shift.getId(),
            shift.getStoreId(),
            shift.getStoreName(),
            shift.getCashierName(),
            shift.getStatus() != null ? shift.getStatus().name() : null
        );
    }

    private PharmacyCashierShift assertCompany(PharmacyCashierShift shift) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        if (companyId != null && !companyId.equals(shift.getCompanyId())) {
            throw PharmacyErrors.of(PharmacyShiftErrors.PHARM_SHIFT_WRONG_COMPANY);
        }
        return shift;
    }
}
