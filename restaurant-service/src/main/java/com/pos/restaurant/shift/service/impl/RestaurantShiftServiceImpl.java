package com.pos.restaurant.shift.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.shift.dto.CashOpRequest;
import com.pos.restaurant.shift.dto.CashOpResponse;
import com.pos.restaurant.shift.dto.CloseShiftRequest;
import com.pos.restaurant.shift.dto.CloseShiftResult;
import com.pos.restaurant.shift.dto.OpenShiftRequest;
import com.pos.restaurant.shift.dto.ShiftReportResponse;
import com.pos.restaurant.shift.dto.ShiftResponse;
import com.pos.restaurant.shift.entity.RestaurantShift;
import com.pos.restaurant.shift.repository.RestaurantCashOpRepository;
import com.pos.restaurant.shift.repository.RestaurantShiftRepository;
import com.pos.restaurant.shift.service.RestaurantShiftService;
import com.pos.restaurant.shift.support.ShiftCashMath;
import com.pos.restaurant.shift.support.ShiftCashOpTotalsLoader;
import com.pos.restaurant.shift.support.ShiftClosePolicy;
import com.pos.restaurant.shift.support.ShiftLookup;
import com.pos.restaurant.shift.support.ShiftResponseAssembler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RestaurantShiftServiceImpl implements RestaurantShiftService {

    private final RestaurantShiftRepository shiftRepository;
    private final FloorTenantSupport tenantSupport;
    private final ShiftLookup shiftLookup;
    private final ShiftClosePolicy closePolicy;
    private final ShiftResponseAssembler assembler;
    private final ShiftOpenHandler openHandler;
    private final ShiftCloseHandler closeHandler;
    private final BuildShiftReportHandler reportHandler;
    private final ShiftCashOpTotalsLoader cashOpTotalsLoader;
    private final RestaurantCashOpRepository cashOpRepository;
    private final PostCashOpHandler cashOpHandler;

    @Override
    @Transactional(readOnly = true)
    public Optional<ShiftResponse> findCurrent(Integer storeId) {
        return shiftLookup.findOpen(storeId)
            .map(shift -> assembler.toResponse(
                shift,
                closePolicy.openOrderCount(shift.getId()),
                cashOpTotalsLoader.totals(shift.getId())
            ));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftResponse> list(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        List<RestaurantShift> shifts = shiftRepository.findByCompanyIdAndStoreIdOrderByOpenedAtDesc(companyId, storeId);
        var drawers = cashOpTotalsLoader.totals(shifts.stream().map(RestaurantShift::getId).toList());
        return shifts.stream()
            .map(shift -> assembler.toResponse(
                shift,
                closePolicy.openOrderCount(shift.getId()),
                drawers.getOrDefault(shift.getId(), ShiftCashMath.Drawer.zero())
            ))
            .toList();
    }

    @Override
    public ShiftResponse open(Integer storeId, OpenShiftRequest request) {
        return openHandler.handle(storeId, request);
    }

    @Override
    public CloseShiftResult close(UUID shiftId, CloseShiftRequest request) {
        return closeHandler.handle(shiftId, request);
    }

    @Override
    public ShiftReportResponse xReport(UUID shiftId) {
        return reportHandler.xReport(shiftId, null, null);
    }

    @Override
    public ShiftReportResponse zReportPreview(UUID shiftId) {
        return reportHandler.zPreview(shiftId, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CashOpResponse> listCashOps(UUID shiftId) {
        shiftLookup.require(shiftId);
        return cashOpRepository.findByShift_IdOrderByCreatedAtDesc(shiftId).stream()
            .map(PostCashOpHandler::toResponse)
            .toList();
    }

    @Override
    public CashOpResponse postCashOp(UUID shiftId, CashOpRequest request) {
        return cashOpHandler.handle(shiftId, request);
    }
}
