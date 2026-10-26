package com.pos.restaurant.booking.service.impl;

import com.pos.restaurant.booking.dto.BookingTableOptionResponse;
import com.pos.restaurant.booking.dto.ReservationResponse;
import com.pos.restaurant.booking.dto.SaveReservationRequest;
import com.pos.restaurant.booking.entity.FloorReservation;
import com.pos.restaurant.booking.repository.FloorReservationRepository;
import com.pos.restaurant.booking.service.FloorReservationService;
import com.pos.restaurant.booking.support.ReservationLookup;
import com.pos.restaurant.booking.support.ReservationResponseAssembler;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.floor.revision.FloorRevisionBump;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.security.RestaurantTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FloorReservationServiceImpl implements FloorReservationService {

    private final FloorReservationRepository reservationRepository;
    private final FloorTableRepository tableRepository;
    private final FloorTenantSupport tenantSupport;
    private final ReservationLookup reservationLookup;
    private final ReservationResponseAssembler assembler;
    private final ReservationCreateHandler createHandler;
    private final ReservationUpdateHandler updateHandler;
    private final ReservationConfirmHandler confirmHandler;
    private final ReservationCancelHandler cancelHandler;
    private final ReservationNoShowHandler noShowHandler;
    private final ReservationSeatHandler seatHandler;
    private final FloorRevisionBump floorRevision;

    @Override
    @Transactional(readOnly = true)
    public List<BookingTableOptionResponse> listBookingTables(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        return tableRepository.findByCompanyIdAndStoreIdAndActiveTrueOrderByHallSortAndCode(companyId, storeId)
            .stream()
            .map(this::toOption)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> list(Integer storeId, Instant from, Instant to, boolean activeOnly) {
        Integer companyId = tenantSupport.requireCompanyId();
        List<FloorReservation> rows = activeOnly
            ? reservationRepository.findByStoreAndStatuses(companyId, storeId, ReservationLookup.ACTIVE_STATUSES)
            : reservationRepository.findByStoreAndRange(
                companyId,
                storeId,
                from != null ? from : Instant.now().minusSeconds(86_400),
                to != null ? to : Instant.now().plusSeconds(86_400L * 7)
            );
        return rows.stream().map(assembler::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse get(UUID reservationId) {
        return assembler.toResponse(reservationLookup.require(reservationId));
    }

    @Override
    @Transactional
    public ReservationResponse create(Integer storeId, SaveReservationRequest request) {
        return touch(createHandler.handle(storeId, request));
    }

    @Override
    @Transactional
    public ReservationResponse update(UUID reservationId, SaveReservationRequest request) {
        return touch(updateHandler.handle(reservationId, request));
    }

    @Override
    @Transactional
    public ReservationResponse confirm(UUID reservationId) {
        return touch(confirmHandler.handle(reservationId));
    }

    @Override
    @Transactional
    public ReservationResponse cancel(UUID reservationId) {
        return touch(cancelHandler.handle(reservationId));
    }

    @Override
    @Transactional
    public ReservationResponse markNoShow(UUID reservationId) {
        return touch(noShowHandler.handle(reservationId));
    }

    @Override
    @Transactional
    public ReservationResponse seat(UUID reservationId) {
        return touch(seatHandler.handle(reservationId));
    }

    private ReservationResponse touch(ReservationResponse response) {
        if (response != null) {
            floorRevision.bump(RestaurantTenantContext.getCompanyId(), response.storeId());
        }
        return response;
    }

    private BookingTableOptionResponse toOption(FloorTable table) {
        return new BookingTableOptionResponse(
            table.getId(),
            table.getCode(),
            table.getLabel(),
            table.getHall().getName(),
            table.getSeatCount(),
            table.getStatus()
        );
    }
}
