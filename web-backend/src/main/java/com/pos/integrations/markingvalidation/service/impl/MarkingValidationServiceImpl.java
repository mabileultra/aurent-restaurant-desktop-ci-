package com.pos.integrations.markingvalidation.service.impl;

import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.integrations.markingvalidation.client.MarkingValidationClient;
import com.pos.integrations.markingvalidation.client.OnkmValidationRequest;
import com.pos.integrations.markingvalidation.dto.MarkingValidationResponse;
import com.pos.integrations.markingvalidation.dto.ValidateMarkingRequest;
import com.pos.integrations.markingvalidation.service.MarkingValidationService;
import com.pos.integrations.multikassa.entity.CashRegisterMultikassaSettings;
import com.pos.integrations.multikassa.repository.CashRegisterMultikassaSettingsRepository;
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
    private final CashRegisterMultikassaSettingsRepository multikassaSettingsRepository;
    private final TenantAccessSupport tenantAccess;
    private final MarkingValidationClient client;

    @Override
    @Transactional(readOnly = true)
    public MarkingValidationResponse validate(ValidateMarkingRequest request) {
        CashRegister register = cashRegisterRepository.findById(request.cashRegisterId())
            .orElseThrow(() -> new ResourceNotFoundException("Cash register not found"));
        tenantAccess.assertCanAccessStore(register.getStore());

        OwnerTerminal owner = resolveOwnerAndTerminal(register);

        return client.validate(new OnkmValidationRequest(
            owner.tin(),
            owner.terminalId(),
            request.refund() ? 1 : 0,
            request.products().stream().map(MarkingValidationServiceImpl::toWire).toList()
        ));
    }

    /** ИНН компании + Terminal ID Multikassa. FiscalDrive в этом контуре не используется. */
    private OwnerTerminal resolveOwnerAndTerminal(CashRegister register) {
        String tin = companyTin(register);
        String terminalId = multikassaTerminalId(register.getId());
        if (!StringUtils.hasText(tin) || !StringUtils.hasText(terminalId)) {
            throw new BadRequestException(
                "Для проверки маркировки укажите ИНН компании и Terminal ID кассы Multikassa"
            );
        }
        return new OwnerTerminal(tin, terminalId);
    }

    private String multikassaTerminalId(Long registerId) {
        return multikassaSettingsRepository.findById(registerId)
            .map(CashRegisterMultikassaSettings::getTerminalId)
            .filter(StringUtils::hasText)
            .map(String::trim)
            .orElse(null);
    }

    private static String companyTin(CashRegister register) {
        if (register.getStore() == null || register.getStore().getCompany() == null) {
            return null;
        }
        String tin = register.getStore().getCompany().getTin();
        return StringUtils.hasText(tin) ? tin.trim() : null;
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

    private record OwnerTerminal(String tin, String terminalId) {}
}
