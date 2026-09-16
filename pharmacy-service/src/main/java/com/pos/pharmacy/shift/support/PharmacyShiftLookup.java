package com.pos.pharmacy.shift.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.integration.dto.CashierShiftSnapshot;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.shift.domain.PharmacyShiftStatus;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import com.pos.pharmacy.shift.repository.PharmacyCashierShiftRepository;
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
            .map(this::assertCompany);
    }

    public PharmacyCashierShift requireOpen(Integer storeId) {
        return findOpen(storeId)
            .orElseThrow(() -> PharmacyErrors.badRequest("Смена не открыта. Откройте смену перед продажей."));
    }

    public PharmacyCashierShift require(UUID shiftId) {
        PharmacyCashierShift shift = shiftRepository.findById(shiftId)
            .orElseThrow(() -> PharmacyErrors.notFound("Shift", shiftId));
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
            throw PharmacyErrors.badRequest("Смена принадлежит другой компании");
        }
        return shift;
    }
}
