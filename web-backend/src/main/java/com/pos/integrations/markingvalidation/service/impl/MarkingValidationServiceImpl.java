package com.pos.integrations.markingvalidation.service.impl;

import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.integrations.fiscaldrive.entity.CashRegisterFiscalDriveSettings;
import com.pos.integrations.fiscaldrive.repository.CashRegisterFiscalDriveSettingsRepository;
import com.pos.integrations.markingvalidation.client.MarkingValidationClient;
import com.pos.integrations.markingvalidation.client.OnkmValidationRequest;
import com.pos.integrations.markingvalidation.dto.MarkingValidationResponse;
import com.pos.integrations.markingvalidation.dto.ValidateMarkingRequest;
import com.pos.integrations.markingvalidation.service.MarkingValidationService;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MarkingValidationServiceImpl implements MarkingValidationService {

    private final CashRegisterRepository cashRegisterRepository;
    private final CashRegisterFiscalDriveSettingsRepository fiscalDriveSettingsRepository;
    private final TenantAccessSupport tenantAccess;
    private final MarkingValidationClient client;

    @Override
    @Transactional(readOnly = true)
    public MarkingValidationResponse validate(ValidateMarkingRequest request) {
        CashRegister register = cashRegisterRepository.findById(request.cashRegisterId())
            .orElseThrow(() -> new ResourceNotFoundException("Cash register not found"));
        tenantAccess.assertCanAccessStore(register.getStore());

        CashRegisterFiscalDriveSettings settings = fiscalDriveSettingsRepository.findById(register.getId())
            .filter(s -> StringUtils.hasText(s.getOwnerTin()) && StringUtils.hasText(s.getTerminalId()))
            .orElseThrow(() -> new BadRequestException(
                "Заполните ИНН владельца и TerminalID в настройках FiscalDrive кассы"
            ));

        return client.validate(new OnkmValidationRequest(
            settings.getOwnerTin(),
            settings.getTerminalId(),
            request.refund() ? 1 : 0,
            request.products().stream().map(MarkingValidationServiceImpl::toWire).toList()
        ));
    }

    private static OnkmValidationRequest.Product toWire(ValidateMarkingRequest.Product product) {
        List<String> fullKmIds = product.fullKmIds() == null || product.fullKmIds().isEmpty()
            ? null
            : product.fullKmIds();
        return new OnkmValidationRequest.Product(
            StringUtils.hasText(product.commitentTin()) ? product.commitentTin() : null,
            product.productCode().trim(),
            StringUtils.hasText(product.packageCode()) ? product.packageCode().trim() : null,
            product.amount(),
            product.kmIds(),
            fullKmIds
        );
    }
}
