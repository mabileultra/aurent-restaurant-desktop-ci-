package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.floor.dto.SaveTableRequest;
import com.pos.restaurant.floor.dto.TableResponse;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.mapper.FloorTableMapper;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import com.pos.restaurant.floor.support.TableCodeUniquenessValidator;
import com.pos.restaurant.floor.support.TableStatusPolicy;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class TableUpdateHandler {

    private final FloorTableMapper tableMapper;
    private final FloorEntityLookup entityLookup;
    private final TableCodeUniquenessValidator codeUniquenessValidator;
    private final TableStatusPolicy tableStatusPolicy;

    @Transactional
    public TableResponse handle(Integer tableId, SaveTableRequest request) {
        FloorTable table = entityLookup.requireTable(tableId);
        String code = request.code().trim();
        codeUniquenessValidator.assertUniqueOnUpdate(table.getHall().getId(), code, tableId);
        table.setCode(code);
        table.setLabel(blankToNull(request.label()));
        table.setSeatCount(request.seatCount());
        table.setPosX(request.posX());
        table.setPosY(request.posY());
        table.setWidth(request.width());
        table.setHeight(request.height());
        table.setStatus(tableStatusPolicy.statusForUpdate(request.status(), table.getStatus()));
        LogUtil.info(TableUpdateHandler.class, "Table updated: id={}", tableId);
        return tableMapper.toResponse(table);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
