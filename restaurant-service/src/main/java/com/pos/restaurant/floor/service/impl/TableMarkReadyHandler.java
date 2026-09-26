package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.dto.TableResponse;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.mapper.FloorTableMapper;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class TableMarkReadyHandler {

    private final FloorEntityLookup entityLookup;
    private final FloorTableMapper tableMapper;

    @Transactional
    public TableResponse handle(Integer tableId) {
        FloorTable table = entityLookup.requireTable(tableId);
        if (table.getStatus() == TableStatus.FREE) {
            return tableMapper.toResponse(table);
        }
        if (table.getStatus() != TableStatus.CLEANING) {
            throw new BusinessException("Table is not in cleaning: " + table.getStatus());
        }
        table.setStatus(TableStatus.FREE);
        LogUtil.info(TableMarkReadyHandler.class, "Table marked ready: id={}", tableId);
        return tableMapper.toResponse(table);
    }
}
