package com.pos.restaurant.service.impl;

import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.restaurant.domain.DiningTableStatus;
import com.pos.restaurant.dto.DiningTableResponse;
import com.pos.restaurant.dto.SaveDiningTableRequest;
import com.pos.restaurant.dto.UpdateDiningTablesLayoutRequest;
import com.pos.restaurant.entity.DiningHall;
import com.pos.restaurant.entity.DiningTable;
import com.pos.restaurant.mapper.RestaurantFloorMapper;
import com.pos.restaurant.repository.DiningHallRepository;
import com.pos.restaurant.repository.DiningTableRepository;
import com.pos.restaurant.service.DiningTableService;
import com.pos.restaurant.support.RestaurantStoreSupport;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiningTableServiceImpl implements DiningTableService {

    private final DiningTableRepository tableRepository;
    private final DiningHallRepository hallRepository;
    private final RestaurantFloorMapper mapper;
    private final RestaurantStoreSupport storeSupport;

    @Override
    public List<DiningTableResponse> listByHall(Integer hallId) {
        DiningHall hall = requireHall(hallId);
        storeSupport.requireRestaurantStore(hall.getStore().getId());
        return mapper.toTableResponses(tableRepository.findByHallIdOrderByCodeAsc(hallId));
    }

    @Override
    @Transactional
    public DiningTableResponse create(Integer hallId, SaveDiningTableRequest request) {
        DiningHall hall = requireHall(hallId);
        storeSupport.requireRestaurantStore(hall.getStore().getId());
        String code = normalizeCode(request.code());
        if (tableRepository.existsByHallIdAndCodeIgnoreCase(hallId, code)) {
            throw new BadRequestException("Table code already exists: " + code);
        }
        DiningTable table = DiningTable.builder()
            .hall(hall)
            .code(code)
            .label(StringUtils.hasText(request.label()) ? request.label().trim() : code)
            .seatCount(request.seatCount())
            .posX(request.posX())
            .posY(request.posY())
            .width(request.width())
            .height(request.height())
            .status(DiningTableStatus.FREE)
            .active(true)
            .build();
        DiningTable saved = tableRepository.save(table);
        LogUtil.info(DiningTableServiceImpl.class, "Dining table created: id={}, hallId={}", saved.getId(), hallId);
        return mapper.toTableResponse(saved);
    }

    @Override
    @Transactional
    public DiningTableResponse update(Integer tableId, SaveDiningTableRequest request) {
        DiningTable table = requireTable(tableId);
        storeSupport.requireRestaurantStore(table.getHall().getStore().getId());
        if (table.getStatus() == DiningTableStatus.OCCUPIED) {
            throw new BadRequestException("Cannot edit occupied table");
        }
        String code = normalizeCode(request.code());
        Integer hallId = table.getHall().getId();
        if (tableRepository.existsByHallIdAndCodeIgnoreCaseAndIdNot(hallId, code, tableId)) {
            throw new BadRequestException("Table code already exists: " + code);
        }
        table.setCode(code);
        table.setLabel(StringUtils.hasText(request.label()) ? request.label().trim() : code);
        table.setSeatCount(request.seatCount());
        table.setPosX(request.posX());
        table.setPosY(request.posY());
        table.setWidth(request.width());
        table.setHeight(request.height());
        DiningTable saved = tableRepository.save(table);
        LogUtil.info(DiningTableServiceImpl.class, "Dining table updated: id={}", tableId);
        return mapper.toTableResponse(saved);
    }

    @Override
    @Transactional
    public List<DiningTableResponse> updateLayout(Integer hallId, UpdateDiningTablesLayoutRequest request) {
        DiningHall hall = requireHall(hallId);
        storeSupport.requireRestaurantStore(hall.getStore().getId());
        List<DiningTable> tables = tableRepository.findByHallIdAndActiveTrueOrderByCodeAsc(hallId);
        Map<Integer, DiningTable> byId = tables.stream()
            .collect(Collectors.toMap(DiningTable::getId, Function.identity()));
        for (UpdateDiningTablesLayoutRequest.TableLayoutItem item : request.tables()) {
            DiningTable table = byId.get(item.id());
            if (table == null) {
                throw new BadRequestException("Table does not belong to hall: " + item.id());
            }
            if (table.getStatus() == DiningTableStatus.OCCUPIED) {
                throw new BadRequestException("Cannot move occupied table: " + table.getCode());
            }
            table.setPosX(item.posX());
            table.setPosY(item.posY());
            table.setWidth(item.width());
            table.setHeight(item.height());
        }
        tableRepository.saveAll(tables);
        LogUtil.info(DiningTableServiceImpl.class, "Dining tables layout updated: hallId={}", hallId);
        return mapper.toTableResponses(tables);
    }

    @Override
    @Transactional
    public void deactivate(Integer tableId) {
        DiningTable table = requireTable(tableId);
        storeSupport.requireRestaurantStore(table.getHall().getStore().getId());
        if (table.getStatus() == DiningTableStatus.OCCUPIED) {
            throw new BadRequestException("Cannot deactivate occupied table");
        }
        table.setActive(false);
        tableRepository.save(table);
        LogUtil.info(DiningTableServiceImpl.class, "Dining table deactivated: id={}", tableId);
    }

    private DiningHall requireHall(Integer hallId) {
        return hallRepository.findById(hallId)
            .orElseThrow(() -> new ResourceNotFoundException("Dining hall not found"));
    }

    private DiningTable requireTable(Integer tableId) {
        return tableRepository.findById(tableId)
            .orElseThrow(() -> new ResourceNotFoundException("Dining table not found"));
    }

    private static String normalizeCode(String code) {
        if (!StringUtils.hasText(code)) {
            throw new BadRequestException("Table code is required");
        }
        return code.trim().toUpperCase();
    }
}
