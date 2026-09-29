package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.dto.TableResponse;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.mapper.FloorTableMapper;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TableMarkReadyHandlerTest {

    @Mock
    private FloorEntityLookup entityLookup;
    @Mock
    private FloorTableMapper tableMapper;
    @InjectMocks
    private TableMarkReadyHandler handler;

    @Test
    void cleaningBecomesFree() {
        FloorTable table = FloorTable.builder().id(7).status(TableStatus.CLEANING).build();
        TableResponse response = new TableResponse(
            7, 1, "Hall", "1", null, 4, 0, 0, 80, 80, TableStatus.FREE, true, null, null, null, null, null
        );
        when(entityLookup.requireTable(7)).thenReturn(table);
        when(tableMapper.toResponse(table)).thenReturn(response);

        TableResponse result = handler.handle(7);

        assertEquals(TableStatus.FREE, table.getStatus());
        assertEquals(response, result);
        verify(tableMapper).toResponse(table);
    }

    @Test
    void alreadyFreeIsIdempotent() {
        FloorTable table = FloorTable.builder().id(7).status(TableStatus.FREE).build();
        TableResponse response = new TableResponse(
            7, 1, "Hall", "1", null, 4, 0, 0, 80, 80, TableStatus.FREE, true, null, null, null, null, null
        );
        when(entityLookup.requireTable(7)).thenReturn(table);
        when(tableMapper.toResponse(table)).thenReturn(response);

        assertEquals(response, handler.handle(7));
        assertEquals(TableStatus.FREE, table.getStatus());
    }

    @Test
    void occupiedRejected() {
        FloorTable table = FloorTable.builder().id(7).status(TableStatus.OCCUPIED).build();
        when(entityLookup.requireTable(7)).thenReturn(table);

        assertThrows(BusinessException.class, () -> handler.handle(7));
    }
}
