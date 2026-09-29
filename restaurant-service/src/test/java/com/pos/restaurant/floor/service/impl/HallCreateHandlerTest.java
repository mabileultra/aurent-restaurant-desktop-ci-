package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.dto.HallResponse;
import com.pos.restaurant.floor.dto.SaveHallRequest;
import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.mapper.FloorHallMapper;
import com.pos.restaurant.floor.repository.FloorHallRepository;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.floor.support.HallNameUniquenessValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HallCreateHandlerTest {

    @Mock
    private FloorHallRepository hallRepository;
    @Mock
    private FloorHallMapper hallMapper;
    @Mock
    private FloorTenantSupport tenantSupport;
    @Mock
    private HallNameUniquenessValidator nameUniquenessValidator;

    @InjectMocks
    private HallCreateHandler handler;

    @BeforeEach
    void setCompany() {
        when(tenantSupport.requireCompanyId()).thenReturn(7);
    }

    @Test
    void createsHallForTenantStore() {
        SaveHallRequest request = new SaveHallRequest("  Зал 1  ", 10, BigDecimal.ZERO);
        when(hallRepository.save(any(FloorHall.class))).thenAnswer(invocation -> {
            FloorHall hall = invocation.getArgument(0);
            hall.setId(3);
            return hall;
        });
        HallResponse response = new HallResponse(3, 4, "Зал 1", 10, true, 0, BigDecimal.ZERO);
        when(hallMapper.toResponse(any(FloorHall.class), anyInt())).thenReturn(response);

        HallResponse result = handler.handle(4, request);

        assertEquals(3, result.id());
        ArgumentCaptor<FloorHall> captor = ArgumentCaptor.forClass(FloorHall.class);
        verify(hallRepository).save(captor.capture());
        FloorHall saved = captor.getValue();
        assertEquals(7, saved.getCompanyId());
        assertEquals(4, saved.getStoreId());
        assertEquals("Зал 1", saved.getName());
        verify(nameUniquenessValidator).assertUniqueOnCreate(7, 4, "Зал 1");
    }

    @Test
    void rejectsDuplicateName() {
        doThrow(new BusinessException("Hall name already exists: VIP"))
            .when(nameUniquenessValidator).assertUniqueOnCreate(7, 4, "VIP");

        assertThrows(BusinessException.class, () -> handler.handle(4, new SaveHallRequest("VIP", 1, BigDecimal.ZERO)));
    }
}
