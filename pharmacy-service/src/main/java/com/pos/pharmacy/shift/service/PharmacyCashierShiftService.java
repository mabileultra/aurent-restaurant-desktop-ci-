package com.pos.pharmacy.shift.service;

import com.pos.pharmacy.shift.dto.ClosePharmacyShiftRequest;
import com.pos.pharmacy.shift.dto.OpenPharmacyShiftRequest;
import com.pos.pharmacy.shift.dto.PharmacyShiftResponse;

import java.util.Optional;
import java.util.UUID;

public interface PharmacyCashierShiftService {

    Optional<PharmacyShiftResponse> findCurrent(Integer storeId);

    PharmacyShiftResponse open(Integer storeId, OpenPharmacyShiftRequest request);

    PharmacyShiftResponse close(UUID shiftId, ClosePharmacyShiftRequest request);
}
