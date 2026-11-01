package com.pos.restaurant.booking.support;

import com.pos.restaurant.booking.dto.BookingTableOptionResponse;
import com.pos.restaurant.booking.dto.ReservationListFilter;
import com.pos.restaurant.booking.dto.ReservationListResponse;
import com.pos.restaurant.booking.dto.ReservationResponse;
import com.pos.restaurant.booking.entity.FloorReservation;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.shared.api.PageLimits;
import com.pos.shared.api.PageResponse;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class ReservationListHandler {

    private final FloorTenantSupport tenantSupport;
    private final FloorTableRepository tableRepository;
    private final ReservationListLoader loader;
    private final ReservationResponseAssembler assembler;

    public ReservationListHandler(
        FloorTenantSupport tenantSupport,
        FloorTableRepository tableRepository,
        ReservationListLoader loader,
        ReservationResponseAssembler assembler
    ) {
        this.tenantSupport = tenantSupport;
        this.tableRepository = tableRepository;
        this.loader = loader;
        this.assembler = assembler;
    }

    @Transactional(readOnly = true)
    public List<BookingTableOptionResponse> listBookingTables(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        return tableRepository.findByCompanyIdAndStoreIdAndActiveTrueOrderByHallSortAndCode(companyId, storeId)
            .stream()
            .map(this::toOption)
            .toList();
    }

    @Transactional(readOnly = true)
    public ReservationListResponse page(Integer storeId, ReservationListFilter filter, int page, int size) {
        Integer companyId = tenantSupport.requireCompanyId();
        ReservationListCriteria criteria = ReservationListCriteria.of(companyId, storeId, filter);
        int safeSize = PageLimits.normalizeSize(size);
        int safePage = PageLimits.normalizePage(page);
        long total = loader.count(criteria);
        List<ReservationResponse> content = total == 0
            ? List.of()
            : mapRows(loader.page(criteria, safePage * safeSize, safeSize));
        return ReservationListResponse.of(
            PageResponse.of(content, safePage, safeSize, total),
            loader.stats(criteria)
        );
    }

    private List<ReservationResponse> mapRows(List<FloorReservation> rows) {
        return rows.stream().map(assembler::toResponse).toList();
    }

    private BookingTableOptionResponse toOption(FloorTable table) {
        return new BookingTableOptionResponse(
            table.getId(),
            table.getCode(),
            table.getLabel(),
            table.getHall().getName(),
            table.getSeatCount(),
            table.getStatus()
        );
    }
}
