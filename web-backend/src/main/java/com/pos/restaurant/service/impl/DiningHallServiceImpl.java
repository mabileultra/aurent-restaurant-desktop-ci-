package com.pos.restaurant.service.impl;

import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.restaurant.domain.TableSessionStatus;
import com.pos.restaurant.dto.BookingTableOptionResponse;
import com.pos.restaurant.dto.DiningHallResponse;
import com.pos.restaurant.dto.DiningTableResponse;
import com.pos.restaurant.dto.RestaurantFloorSnapshotResponse;
import com.pos.restaurant.dto.SaveDiningHallRequest;
import com.pos.restaurant.entity.DiningHall;
import com.pos.restaurant.entity.TableSession;
import com.pos.restaurant.entity.TableSessionLine;
import com.pos.restaurant.mapper.RestaurantFloorMapper;
import com.pos.restaurant.repository.DiningHallRepository;
import com.pos.restaurant.repository.DiningTableRepository;
import com.pos.restaurant.repository.TableSessionLineRepository;
import com.pos.restaurant.repository.TableSessionRepository;
import com.pos.restaurant.service.DiningHallService;
import com.pos.restaurant.support.RestaurantStoreSupport;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiningHallServiceImpl implements DiningHallService {

    private final DiningHallRepository hallRepository;
    private final DiningTableRepository tableRepository;
    private final TableSessionRepository sessionRepository;
    private final TableSessionLineRepository sessionLineRepository;
    private final RestaurantFloorMapper mapper;
    private final RestaurantStoreSupport storeSupport;

    @Override
    public List<DiningHallResponse> listByStore(Integer storeId) {
        storeSupport.requireRestaurantStore(storeId);
        return hallRepository.findByStoreIdOrderBySortOrderAscNameAsc(storeId).stream()
            .map(hall -> mapper.toHallResponse(hall, countActiveTables(hall.getId())))
            .toList();
    }

    @Override
    public RestaurantFloorSnapshotResponse getFloorSnapshot(Integer storeId) {
        Store store = storeSupport.requireRestaurantStore(storeId);
        List<TableSession> openSessions = sessionRepository.findWithLinesByStoreIdAndStatus(
            storeId, TableSessionStatus.OPEN);
        Map<Integer, TableSession> sessionsByTableId = openSessions.stream()
            .collect(Collectors.toMap(s -> s.getTable().getId(), s -> s, (a, b) -> a));
        Map<UUID, List<TableSessionLine>> linesBySessionId = openSessions.stream()
            .collect(Collectors.toMap(
                TableSession::getId,
                s -> sessionLineRepository.findBySessionIdOrderBySortOrderAscCreatedAtAsc(s.getId())
            ));
        List<RestaurantFloorSnapshotResponse.DiningHallWithTablesResponse> halls =
            hallRepository.findByStoreIdAndActiveTrueOrderBySortOrderAscNameAsc(storeId).stream()
                .map(hall -> new RestaurantFloorSnapshotResponse.DiningHallWithTablesResponse(
                    hall.getId(),
                    hall.getName(),
                    hall.getSortOrder(),
                    hall.isActive(),
                    mapper.toTableResponses(
                        tableRepository.findByHallIdAndActiveTrueOrderByCodeAsc(hall.getId()),
                        sessionsByTableId,
                        linesBySessionId
                    )
                ))
                .toList();
        return new RestaurantFloorSnapshotResponse(store.getId(), store.getName(), halls);
    }

    @Override
    public List<BookingTableOptionResponse> listBookingTables(Integer storeId) {
        storeSupport.requireRestaurantStore(storeId);
        return hallRepository.findByStoreIdAndActiveTrueOrderBySortOrderAscNameAsc(storeId).stream()
            .flatMap(hall -> tableRepository.findByHallIdAndActiveTrueOrderByCodeAsc(hall.getId()).stream()
                .map(table -> new BookingTableOptionResponse(
                    table.getId(),
                    hall.getId(),
                    hall.getName(),
                    table.getCode(),
                    table.getLabel(),
                    table.getSeatCount(),
                    table.getStatus().name()
                )))
            .toList();
    }

    @Override
    @Transactional
    public DiningHallResponse create(Integer storeId, SaveDiningHallRequest request) {
        Store store = storeSupport.requireRestaurantStore(storeId);
        String name = request.name().trim();
        if (hallRepository.existsByStoreIdAndNameIgnoreCase(storeId, name)) {
            throw new BadRequestException("Hall name already exists: " + name);
        }
        DiningHall hall = DiningHall.builder()
            .store(store)
            .name(name)
            .sortOrder(request.sortOrder())
            .active(true)
            .build();
        DiningHall saved = hallRepository.save(hall);
        LogUtil.info(DiningHallServiceImpl.class, "Dining hall created: id={}, storeId={}", saved.getId(), storeId);
        return mapper.toHallResponse(saved, 0);
    }

    @Override
    @Transactional
    public DiningHallResponse update(Integer hallId, SaveDiningHallRequest request) {
        DiningHall hall = requireHall(hallId);
        storeSupport.requireRestaurantStore(hall.getStore().getId());
        String name = request.name().trim();
        if (hallRepository.existsByStoreIdAndNameIgnoreCaseAndIdNot(hall.getStore().getId(), name, hallId)) {
            throw new BadRequestException("Hall name already exists: " + name);
        }
        hall.setName(name);
        hall.setSortOrder(request.sortOrder());
        DiningHall saved = hallRepository.save(hall);
        LogUtil.info(DiningHallServiceImpl.class, "Dining hall updated: id={}", hallId);
        return mapper.toHallResponse(saved, countActiveTables(hallId));
    }

    @Override
    @Transactional
    public void deactivate(Integer hallId) {
        DiningHall hall = requireHall(hallId);
        storeSupport.requireRestaurantStore(hall.getStore().getId());
        if (countActiveTables(hallId) > 0) {
            throw new BadRequestException("Cannot deactivate hall with active tables");
        }
        hall.setActive(false);
        hallRepository.save(hall);
        LogUtil.info(DiningHallServiceImpl.class, "Dining hall deactivated: id={}", hallId);
    }

    private DiningHall requireHall(Integer hallId) {
        return hallRepository.findById(hallId)
            .orElseThrow(() -> new ResourceNotFoundException("Dining hall not found"));
    }

    private int countActiveTables(Integer hallId) {
        return (int) tableRepository.findByHallIdAndActiveTrueOrderByCodeAsc(hallId).size();
    }
}
