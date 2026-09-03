package com.pos.restaurant.floor.support;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.repository.FloorHallRepository;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FloorEntityLookup {

    private final FloorHallRepository hallRepository;
    private final FloorTableRepository tableRepository;
    private final FloorTenantSupport tenantSupport;

    public FloorHall requireHall(Integer hallId) {
        Integer companyId = tenantSupport.requireCompanyId();
        return hallRepository.findByIdAndCompanyId(hallId, companyId)
            .orElseThrow(() -> new NotFoundException("Hall not found: " + hallId));
    }

    public FloorTable requireTable(Integer tableId) {
        Integer companyId = tenantSupport.requireCompanyId();
        return tableRepository.findByIdAndCompanyId(tableId, companyId)
            .orElseThrow(() -> new NotFoundException("Table not found: " + tableId));
    }
}
