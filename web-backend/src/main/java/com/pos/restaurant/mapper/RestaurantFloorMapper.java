package com.pos.restaurant.mapper;

import com.pos.restaurant.dto.DiningHallResponse;
import com.pos.restaurant.dto.DiningTableResponse;
import com.pos.restaurant.dto.TableSessionSummaryResponse;
import com.pos.restaurant.entity.DiningHall;
import com.pos.restaurant.entity.DiningTable;
import com.pos.restaurant.entity.TableSession;
import com.pos.restaurant.entity.TableSessionLine;
import com.pos.restaurant.support.TableSessionMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class RestaurantFloorMapper {

    private final TableSessionMapper sessionMapper;

    public RestaurantFloorMapper(TableSessionMapper sessionMapper) {
        this.sessionMapper = sessionMapper;
    }

    public DiningHallResponse toHallResponse(DiningHall hall, int tablesCount) {
        return new DiningHallResponse(
            hall.getId(),
            hall.getStore().getId(),
            hall.getStore().getName(),
            hall.getName(),
            hall.getSortOrder(),
            hall.isActive(),
            tablesCount
        );
    }

    public DiningTableResponse toTableResponse(DiningTable table, TableSessionSummaryResponse activeSession) {
        return new DiningTableResponse(
            table.getId(),
            table.getHall().getId(),
            table.getHall().getName(),
            table.getCode(),
            table.getLabel(),
            table.getSeatCount(),
            table.getPosX(),
            table.getPosY(),
            table.getWidth(),
            table.getHeight(),
            table.getStatus(),
            table.isActive(),
            activeSession
        );
    }

    public DiningTableResponse toTableResponse(DiningTable table) {
        return toTableResponse(table, null);
    }

    public List<DiningTableResponse> toTableResponses(
        List<DiningTable> tables,
        Map<Integer, TableSession> sessionsByTableId,
        Map<java.util.UUID, List<TableSessionLine>> linesBySessionId
    ) {
        return tables.stream()
            .map(table -> {
                TableSession session = sessionsByTableId.get(table.getId());
                TableSessionSummaryResponse summary = null;
                if (session != null) {
                    List<TableSessionLine> lines = linesBySessionId.getOrDefault(session.getId(), List.of());
                    summary = sessionMapper.toSummary(session, lines);
                }
                return toTableResponse(table, summary);
            })
            .toList();
    }

    public List<DiningTableResponse> toTableResponses(List<DiningTable> tables) {
        return tables.stream().map(this::toTableResponse).toList();
    }
}
