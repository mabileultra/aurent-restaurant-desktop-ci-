package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.floor.dto.SaveTableRequest;
import com.pos.restaurant.floor.dto.TableResponse;
import com.pos.restaurant.floor.dto.UpdateTableLayoutRequest;
import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.mapper.FloorTableMapper;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.floor.revision.FloorRevisionBump;
import com.pos.restaurant.floor.service.FloorTableService;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FloorTableServiceImpl implements FloorTableService {

    private final FloorTableRepository tableRepository;
    private final FloorTableMapper tableMapper;
    private final FloorEntityLookup entityLookup;
    private final TableCreateHandler createHandler;
    private final TableUpdateHandler updateHandler;
    private final TableLayoutUpdateHandler layoutUpdateHandler;
    private final TableMarkReadyHandler markReadyHandler;
    private final TableDeactivateHandler deactivateHandler;
    private final FloorRevisionBump floorRevision;

    @Override
    public List<TableResponse> listByHall(Integer hallId) {
        entityLookup.requireHall(hallId);
        return tableRepository.findByHallIdOrderByCodeAsc(hallId).stream()
            .map(tableMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional
    public TableResponse create(Integer hallId, SaveTableRequest request) {
        TableResponse response = createHandler.handle(hallId, request);
        bumpHall(hallId);
        return response;
    }

    @Override
    @Transactional
    public TableResponse update(Integer tableId, SaveTableRequest request) {
        TableResponse response = updateHandler.handle(tableId, request);
        bumpTable(tableId);
        return response;
    }

    @Override
    @Transactional
    public List<TableResponse> updateLayout(Integer hallId, UpdateTableLayoutRequest request) {
        List<TableResponse> response = layoutUpdateHandler.handle(hallId, request);
        bumpHall(hallId);
        return response;
    }

    @Override
    @Transactional
    public TableResponse markReady(Integer tableId) {
        TableResponse response = markReadyHandler.handle(tableId);
        bumpTable(tableId);
        return response;
    }

    @Override
    @Transactional
    public void deactivate(Integer tableId) {
        deactivateHandler.handle(tableId);
        bumpTable(tableId);
    }

    private void bumpTable(Integer tableId) {
        tableRepository.findById(tableId).ifPresent(table ->
            floorRevision.bump(table.getCompanyId(), table.getStoreId())
        );
    }

    private void bumpHall(Integer hallId) {
        FloorHall hall = entityLookup.requireHall(hallId);
        floorRevision.bump(hall.getCompanyId(), hall.getStoreId());
    }
}
