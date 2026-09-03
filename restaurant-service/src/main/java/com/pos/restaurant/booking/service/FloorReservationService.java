package com.pos.restaurant.booking.service;

import com.pos.restaurant.booking.dto.BookingTableOptionResponse;
import com.pos.restaurant.booking.dto.ReservationResponse;
import com.pos.restaurant.booking.dto.SaveReservationRequest;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface FloorReservationService {

    List<BookingTableOptionResponse> listBookingTables(Integer storeId);

    List<ReservationResponse> list(Integer storeId, Instant from, Instant to, boolean activeOnly);

    ReservationResponse get(UUID reservationId);

    ReservationResponse create(Integer storeId, SaveReservationRequest request);

    ReservationResponse update(UUID reservationId, SaveReservationRequest request);

    ReservationResponse confirm(UUID reservationId);

    ReservationResponse cancel(UUID reservationId);

    ReservationResponse markNoShow(UUID reservationId);

    ReservationResponse seat(UUID reservationId);
}
