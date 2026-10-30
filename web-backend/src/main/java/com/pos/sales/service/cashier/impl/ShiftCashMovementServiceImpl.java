package com.pos.sales.service.cashier.impl;

import com.pos.exception.BadRequestException;
import com.pos.sales.dto.cashier.ShiftCashMovementRequest;
import com.pos.sales.dto.cashier.ShiftCashMovementResponse;
import com.pos.sales.entity.CashierShift;
import com.pos.sales.entity.ShiftCashMovement;
import com.pos.sales.repository.ShiftCashMovementRepository;
import com.pos.sales.service.cashier.ShiftCashMovementService;
import com.pos.sales.service.cashier.support.CashierShiftAccessPolicy;
import com.pos.security.CurrentUserProvider;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ShiftCashMovementServiceImpl implements ShiftCashMovementService {

    private final ShiftCashMovementRepository movementRepository;
    private final CashierShiftAccessPolicy shiftAccessPolicy;
    private final CurrentUserProvider currentUserProvider;

    @Override
    public ShiftCashMovementResponse cashIn(UUID shiftId, ShiftCashMovementRequest request) {
        return record(shiftId, request, ShiftCashMovement.Direction.IN);
    }

    @Override
    public ShiftCashMovementResponse cashOut(UUID shiftId, ShiftCashMovementRequest request) {
        return record(shiftId, request, ShiftCashMovement.Direction.OUT);
    }

    private ShiftCashMovementResponse record(
        UUID shiftId,
        ShiftCashMovementRequest request,
        ShiftCashMovement.Direction direction
    ) {
        if (request == null || request.amount() == null) {
            throw new BadRequestException("amount required");
        }
        CashierShift shift = shiftAccessPolicy.requireOwned(shiftId);
        if (shift.getStatus() != CashierShift.ShiftStatus.OPEN) {
            throw new BadRequestException("Смена закрыта");
        }
        UUID actorId = currentUserProvider.requireCurrentUser().getId();
        ShiftCashMovement saved = movementRepository.save(ShiftCashMovement.builder()
            .shift(shift)
            .direction(direction)
            .amount(request.amount())
            .note(StringUtils.hasText(request.note()) ? request.note().trim() : null)
            .createdBy(actorId)
            .build());
        LogUtil.info(
            ShiftCashMovementServiceImpl.class,
            "Shift cash {}: id={}, shiftId={}, amount={}",
            direction,
            saved.getId(),
            shiftId,
            saved.getAmount()
        );
        return new ShiftCashMovementResponse(
            saved.getId(),
            shiftId,
            saved.getDirection().name(),
            saved.getAmount(),
            saved.getNote(),
            saved.getCreatedAt()
        );
    }
}
