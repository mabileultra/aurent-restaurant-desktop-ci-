package com.pos.restaurant.service.impl;

import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.restaurant.domain.DiningTableStatus;
import com.pos.restaurant.domain.TableReservationStatus;
import com.pos.restaurant.dto.SaveTableReservationRequest;
import com.pos.restaurant.dto.TableReservationResponse;
import com.pos.restaurant.entity.DiningTable;
import com.pos.restaurant.entity.TableReservation;
import com.pos.restaurant.repository.DiningTableRepository;
import com.pos.restaurant.repository.TableReservationRepository;
import com.pos.restaurant.repository.TableSessionRepository;
import com.pos.restaurant.domain.TableSessionStatus;
import com.pos.restaurant.service.TableReservationService;
import com.pos.restaurant.support.RestaurantStoreSupport;
import com.pos.restaurant.support.TableReservationMapper;
import com.pos.security.CurrentUserProvider;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TableReservationServiceImpl implements TableReservationService {

    private static final List<TableReservationStatus> ACTIVE_STATUSES = List.of(
        TableReservationStatus.PENDING,
        TableReservationStatus.CONFIRMED
    );

    private final TableReservationRepository reservationRepository;
    private final DiningTableRepository tableRepository;
    private final TableSessionRepository sessionRepository;
    private final RestaurantStoreSupport storeSupport;
    private final TableReservationMapper mapper;
    private final CurrentUserProvider currentUserProvider;

    @Override
    @Transactional(readOnly = true)
    public List<TableReservationResponse> listByStore(Integer storeId, Instant from, Instant to) {
        storeSupport.requireRestaurantStore(storeId);
        Instant rangeFrom = from != null ? from : Instant.now().minusSeconds(86_400);
        Instant rangeTo = to != null ? to : rangeFrom.plusSeconds(86_400 * 7);
        return reservationRepository.findByStoreIdAndReservedAtBetweenOrderByReservedAtAsc(storeId, rangeFrom, rangeTo)
            .stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TableReservationResponse> listActive(Integer storeId) {
        storeSupport.requireRestaurantStore(storeId);
        return reservationRepository.findByStoreIdAndStatusInOrderByReservedAtAsc(storeId, ACTIVE_STATUSES)
            .stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TableReservationResponse getById(UUID reservationId) {
        return mapper.toResponse(requireReservation(reservationId));
    }

    @Override
    public TableReservationResponse create(Integer storeId, SaveTableReservationRequest request) {
        Store store = storeSupport.requireRestaurantStore(storeId);
        DiningTable table = requireActiveTable(request.tableId());
        assertTableBelongsToStore(table, storeId);
        assertTableAvailable(table.getId(), null);
        User currentUser = currentUserProvider.requireCurrentUser();
        TableReservation reservation = TableReservation.builder()
            .store(store)
            .table(table)
            .clientName(request.clientName().trim())
            .clientPhone(trimOrNull(request.clientPhone()))
            .guestCount(request.guestCount())
            .reservedAt(request.reservedAt())
            .durationMinutes(request.durationMinutes() != null ? request.durationMinutes() : 120)
            .notes(trimOrNull(request.notes()))
            .status(TableReservationStatus.PENDING)
            .createdBy(currentUser)
            .build();
        TableReservation saved = reservationRepository.save(reservation);
        LogUtil.info(TableReservationServiceImpl.class, "Table reservation created: {} table={}", saved.getId(), table.getCode());
        return mapper.toResponse(saved);
    }

    @Override
    public TableReservationResponse update(UUID reservationId, SaveTableReservationRequest request) {
        TableReservation reservation = requireReservation(reservationId);
        if (reservation.getStatus() == TableReservationStatus.SEATED
            || reservation.getStatus() == TableReservationStatus.CANCELLED
            || reservation.getStatus() == TableReservationStatus.NO_SHOW) {
            throw new BadRequestException("Cannot update reservation in status " + reservation.getStatus());
        }
        DiningTable table = requireActiveTable(request.tableId());
        assertTableBelongsToStore(table, reservation.getStore().getId());
        if (!table.getId().equals(reservation.getTable().getId())) {
            assertTableAvailable(table.getId(), reservationId);
        }
        reservation.setTable(table);
        reservation.setClientName(request.clientName().trim());
        reservation.setClientPhone(trimOrNull(request.clientPhone()));
        reservation.setGuestCount(request.guestCount());
        reservation.setReservedAt(request.reservedAt());
        if (request.durationMinutes() != null) {
            reservation.setDurationMinutes(request.durationMinutes());
        }
        reservation.setNotes(trimOrNull(request.notes()));
        return mapper.toResponse(reservation);
    }

    @Override
    public TableReservationResponse confirm(UUID reservationId) {
        TableReservation reservation = requireReservation(reservationId);
        if (reservation.getStatus() != TableReservationStatus.PENDING) {
            throw new BadRequestException("Only pending reservations can be confirmed");
        }
        DiningTable table = reservation.getTable();
        if (sessionRepository.findByTableIdAndStatus(table.getId(), TableSessionStatus.OPEN).isPresent()) {
            throw new BadRequestException("Table is occupied");
        }
        reservation.setStatus(TableReservationStatus.CONFIRMED);
        table.setStatus(DiningTableStatus.RESERVED);
        LogUtil.info(TableReservationServiceImpl.class, "Table reservation confirmed: {}", reservationId);
        return mapper.toResponse(reservation);
    }

    @Override
    public TableReservationResponse cancel(UUID reservationId) {
        TableReservation reservation = requireReservation(reservationId);
        if (reservation.getStatus() == TableReservationStatus.CANCELLED) {
            return mapper.toResponse(reservation);
        }
        if (reservation.getStatus() == TableReservationStatus.SEATED) {
            throw new BadRequestException("Cannot cancel seated reservation");
        }
        reservation.setStatus(TableReservationStatus.CANCELLED);
        releaseTableIfReserved(reservation.getTable());
        LogUtil.info(TableReservationServiceImpl.class, "Table reservation cancelled: {}", reservationId);
        return mapper.toResponse(reservation);
    }

    @Override
    public TableReservationResponse markNoShow(UUID reservationId) {
        TableReservation reservation = requireReservation(reservationId);
        if (reservation.getStatus() != TableReservationStatus.CONFIRMED
            && reservation.getStatus() != TableReservationStatus.PENDING) {
            throw new BadRequestException("Cannot mark no-show for status " + reservation.getStatus());
        }
        reservation.setStatus(TableReservationStatus.NO_SHOW);
        releaseTableIfReserved(reservation.getTable());
        LogUtil.info(TableReservationServiceImpl.class, "Table reservation no-show: {}", reservationId);
        return mapper.toResponse(reservation);
    }

    private TableReservation requireReservation(UUID reservationId) {
        TableReservation reservation = reservationRepository.findByIdWithDetails(reservationId)
            .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
        storeSupport.requireRestaurantStore(reservation.getStore().getId());
        return reservation;
    }

    private DiningTable requireActiveTable(Integer tableId) {
        DiningTable table = tableRepository.findById(tableId)
            .orElseThrow(() -> new ResourceNotFoundException("Table not found"));
        if (!table.isActive()) {
            throw new BadRequestException("Table is inactive");
        }
        return table;
    }

    private void assertTableBelongsToStore(DiningTable table, Integer storeId) {
        if (!table.getHall().getStore().getId().equals(storeId)) {
            throw new BadRequestException("Table does not belong to store");
        }
    }

    private void assertTableAvailable(Integer tableId, UUID excludeReservationId) {
        if (sessionRepository.findByTableIdAndStatus(tableId, TableSessionStatus.OPEN).isPresent()) {
            throw new BadRequestException("Table is occupied");
        }
        if (excludeReservationId != null
            && reservationRepository.existsByTableIdAndStatusInAndIdNot(tableId, ACTIVE_STATUSES, excludeReservationId)) {
            throw new BadRequestException("Table already has an active reservation");
        }
        if (excludeReservationId == null
            && reservationRepository.findByTableIdAndStatusIn(tableId, ACTIVE_STATUSES).isPresent()) {
            throw new BadRequestException("Table already has an active reservation");
        }
    }

    private void releaseTableIfReserved(DiningTable table) {
        if (table.getStatus() == DiningTableStatus.RESERVED
            && sessionRepository.findByTableIdAndStatus(table.getId(), TableSessionStatus.OPEN).isEmpty()) {
            table.setStatus(DiningTableStatus.FREE);
        }
    }

    private static String trimOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
