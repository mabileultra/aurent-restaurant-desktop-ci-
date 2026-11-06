package com.pos.restaurant.kitchen.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.kitchen.dto.SaveStationRequest;
import com.pos.restaurant.kitchen.dto.StationResponse;
import com.pos.restaurant.kitchen.entity.KitchenStation;
import com.pos.restaurant.kitchen.mapper.KitchenStationMapper;
import com.pos.restaurant.kitchen.repository.KitchenStationRepository;
import com.pos.restaurant.kitchen.support.StationCodeUniquenessValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StationCreateHandlerTest {

    @Mock
    private KitchenStationRepository stationRepository;
    @Mock
    private KitchenStationMapper stationMapper;
    @Mock
    private FloorTenantSupport tenantSupport;
    @Mock
    private StationCodeUniquenessValidator codeUniquenessValidator;
    @InjectMocks
    private StationCreateHandler handler;

    @Test
    void reactivatesHiddenStationWithTheSameCode() {
        UUID id = UUID.randomUUID();
        KitchenStation hidden = KitchenStation.builder()
            .id(id)
            .companyId(7)
            .storeId(114)
            .code("1")
            .name("old")
            .active(false)
            .build();
        when(tenantSupport.requireCompanyId()).thenReturn(7);
        when(stationRepository.findByStoreIdAndCodeIgnoreCase(114, "1")).thenReturn(List.of(hidden));
        when(stationRepository.save(hidden)).thenReturn(hidden);
        when(stationMapper.toResponse(hidden)).thenReturn(
            new StationResponse(id, 114, "1", "ichimliklar", 100, true)
        );

        handler.handle(114, new SaveStationRequest("1", "ichimliklar", 100));

        assertTrue(hidden.isActive());
        verify(stationRepository).save(hidden);
    }
}
