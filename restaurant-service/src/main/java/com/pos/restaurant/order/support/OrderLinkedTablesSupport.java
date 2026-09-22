package com.pos.restaurant.order.support;

import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderTableLink;
import com.pos.restaurant.order.repository.FloorOrderTableLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OrderLinkedTablesSupport {

    private final FloorOrderTableLinkRepository linkRepository;

    public List<FloorTable> allTables(FloorOrder order) {
        List<FloorTable> tables = new ArrayList<>();
        if (order.getTable() != null) {
            tables.add(order.getTable());
        }
        for (FloorOrderTableLink link : linkRepository.findByOrderId(order.getId())) {
            if (link.getTable() != null) {
                tables.add(link.getTable());
            }
        }
        return tables;
    }

    public void applyStatus(FloorOrder order, TableStatus status) {
        for (FloorTable table : allTables(order)) {
            table.setStatus(status);
        }
    }

    public void clearLinks(UUID orderId) {
        linkRepository.deleteByOrderId(orderId);
    }

    public FloorOrderTableLink linkTable(FloorOrder order, FloorTable table, UUID linkedByUserId) {
        return linkRepository.save(FloorOrderTableLink.builder()
            .order(order)
            .table(table)
            .linkedByUserId(linkedByUserId)
            .build());
    }
}
