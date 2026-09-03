package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.dto.TableResponse;
import com.pos.restaurant.floor.dto.UpdateTableLayoutRequest;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.mapper.FloorTableMapper;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TableLayoutUpdateHandler {

    private final FloorTableRepository tableRepository;
    private final FloorTableMapper tableMapper;
    private final FloorEntityLookup entityLookup;

    @Transactional
    public List<TableResponse> handle(Integer hallId, UpdateTableLayoutRequest request) {
        entityLookup.requireHall(hallId);
        List<FloorTable> tables = tableRepository.findByHallIdOrderByCodeAsc(hallId);
        Map<Integer, FloorTable> byId = tables.stream()
            .collect(Collectors.toMap(FloorTable::getId, Function.identity()));
        for (UpdateTableLayoutRequest.TableLayoutItem item : request.tables()) {
            FloorTable table = byId.get(item.id());
            if (table == null) {
                throw new BusinessException("Table does not belong to hall: " + item.id());
            }
            table.setPosX(item.posX());
            table.setPosY(item.posY());
            table.setWidth(item.width());
            table.setHeight(item.height());
        }
        LogUtil.info(TableLayoutUpdateHandler.class, "Table layout updated: hallId={}", hallId);
        return tableRepository.findByHallIdOrderByCodeAsc(hallId).stream()
            .map(tableMapper::toResponse)
            .toList();
    }
}
