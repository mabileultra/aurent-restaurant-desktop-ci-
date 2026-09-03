package com.pos.restaurant.booking.service.impl;

import com.pos.restaurant.booking.domain.ReservationStatus;
import com.pos.restaurant.booking.dto.ReservationResponse;
import com.pos.restaurant.booking.dto.SaveReservationRequest;
import com.pos.restaurant.booking.entity.FloorReservation;
import com.pos.restaurant.booking.repository.FloorReservationRepository;
import com.pos.restaurant.booking.support.ReservationResponseAssembler;
import com.pos.restaurant.booking.support.ReservationTablePolicy;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class ReservationCreateHandler {

    private final FloorReservationRepository reservationRepository;
    private final FloorEntityLookup entityLookup;
    private final FloorTenantSupport tenantSupport;
    private final ReservationTablePolicy tablePolicy;
    private final ReservationResponseAssembler assembler;

    @Transactional
    public ReservationResponse handle(Integer storeId, SaveReservationRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        FloorTable table = entityLookup.requireTable(request.tableId());
        tablePolicy.assertActive(table);
        tablePolicy.assertBelongsToStore(table, storeId);
        tablePolicy.assertAvailable(table.getId(), null);
        FloorReservation saved = reservationRepository.save(FloorReservation.builder()
            .companyId(companyId)
            .storeId(storeId)
            .table(table)
            .clientName(request.clientName().trim())
            .clientPhone(trimOrNull(request.clientPhone()))
            .guestCount(request.guestCount())
            .reservedAt(request.reservedAt())
            .durationMinutes(request.durationMinutes() != null ? request.durationMinutes() : 120)
            .notes(trimOrNull(request.notes()))
            .status(ReservationStatus.PENDING)
            .createdByUserId(tenantSupport.requireUserId())
            .build());
        LogUtil.info(ReservationCreateHandler.class, "Reservation created: id={}, tableId={}", saved.getId(), table.getId());
        return assembler.toResponse(saved);
    }

    private static String trimOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
