package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.dto.SaveTableRequest;
import com.pos.restaurant.floor.dto.TableResponse;
import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.mapper.FloorTableMapper;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import com.pos.restaurant.floor.support.TableCodeUniquenessValidator;
import com.pos.restaurant.floor.support.TableStatusPolicy;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class TableCreateHandler {

    private final FloorTableRepository tableRepository;
    private final FloorTableMapper tableMapper;
    private final FloorEntityLookup entityLookup;
    private final TableCodeUniquenessValidator codeUniquenessValidator;
    private final TableStatusPolicy tableStatusPolicy;

    @Transactional
    public TableResponse handle(Integer hallId, SaveTableRequest request) {
        FloorHall hall = entityLookup.requireHall(hallId);
        if (!hall.isActive()) {
            throw new BusinessException("Cannot add tables to an inactive hall");
        }
        String code = request.code().trim();
        codeUniquenessValidator.assertUniqueOnCreate(hallId, code);
        FloorTable saved = tableRepository.save(FloorTable.builder()
            .hall(hall)
            .companyId(hall.getCompanyId())
            .storeId(hall.getStoreId())
            .code(code)
            .label(blankToNull(request.label()))
            .seatCount(request.seatCount())
            .posX(request.posX())
            .posY(request.posY())
            .width(request.width())
            .height(request.height())
            .status(tableStatusPolicy.statusForCreate(request.status()))
            .active(true)
            .build());
        LogUtil.info(TableCreateHandler.class, "Table created: id={}, hallId={}", saved.getId(), hallId);
        return tableMapper.toResponse(saved);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
