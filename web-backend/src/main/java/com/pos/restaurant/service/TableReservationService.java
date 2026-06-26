package com.pos.restaurant.service;

import com.pos.restaurant.dto.SaveTableReservationRequest;
import com.pos.restaurant.dto.TableReservationResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface TableReservationService {

    List<TableReservationResponse> listByStore(Integer storeId, Instant from, Instant to);

    List<TableReservationResponse> listActive(Integer storeId);

    TableReservationResponse getById(UUID reservationId);

    TableReservationResponse create(Integer storeId, SaveTableReservationRequest request);

    TableReservationResponse update(UUID reservationId, SaveTableReservationRequest request);

    TableReservationResponse confirm(UUID reservationId);

    TableReservationResponse cancel(UUID reservationId);

    TableReservationResponse markNoShow(UUID reservationId);
}
