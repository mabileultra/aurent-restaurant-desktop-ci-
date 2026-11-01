package com.pos.restaurant.booking.service.impl;

import com.pos.restaurant.booking.dto.BookingTableOptionResponse;
import com.pos.restaurant.booking.dto.ReservationListFilter;
import com.pos.restaurant.booking.dto.ReservationListResponse;
import com.pos.restaurant.booking.dto.ReservationResponse;
import com.pos.restaurant.booking.dto.SaveReservationRequest;
import com.pos.restaurant.booking.service.FloorReservationService;
import com.pos.restaurant.booking.support.ReservationListHandler;
import com.pos.restaurant.booking.support.ReservationLookup;
import com.pos.restaurant.booking.support.ReservationResponseAssembler;
import com.pos.restaurant.floor.revision.FloorRevisionBump;
import com.pos.restaurant.security.RestaurantTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FloorReservationServiceImpl implements FloorReservationService {

    private final ReservationListHandler listHandler;
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
    public List<BookingTableOptionResponse> listBookingTables(Integer storeId) {
        return listHandler.listBookingTables(storeId);
    }

    @Override
    public ReservationListResponse list(Integer storeId, ReservationListFilter filter, int page, int size) {
        return listHandler.page(storeId, filter, page, size);
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
}
