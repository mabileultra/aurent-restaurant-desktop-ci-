package com.pos.integrations.markingvalidation.service.impl;

import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.integrations.fiscaldrive.entity.CashRegisterFiscalDriveSettings;
import com.pos.integrations.fiscaldrive.repository.CashRegisterFiscalDriveSettingsRepository;
import com.pos.integrations.markingvalidation.client.MarkingValidationClient;
import com.pos.integrations.markingvalidation.client.OnkmValidationRequest;
import com.pos.integrations.markingvalidation.dto.MarkingValidationResponse;
import com.pos.integrations.markingvalidation.dto.ValidateMarkingRequest;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.service.support.TenantAccessSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MarkingValidationServiceImplTest {

    @Mock private CashRegisterRepository cashRegisterRepository;
    @Mock private CashRegisterFiscalDriveSettingsRepository fiscalDriveSettingsRepository;
    @Mock private TenantAccessSupport tenantAccess;
    @Mock private MarkingValidationClient client;

    @InjectMocks private MarkingValidationServiceImpl service;

    private final Store store = Store.builder().id(5).name("Shop").build();
    private final CashRegister register =
        CashRegister.builder().id(11L).store(store).registerNumber(1).status("ACTIVE").build();

    private static ValidateMarkingRequest request(boolean refund) {
        return new ValidateMarkingRequest(11L, refund, List.of(new ValidateMarkingRequest.Product(
            "02208005001025008", " 1077302 ", new BigDecimal("2"),
            List.of("010509987308971221uC*NTOg"), List.of(), ""
        )));
    }

    @Test
    void ownerTinAndTerminalComeFromRegisterSettings() {
        when(cashRegisterRepository.findById(11L)).thenReturn(Optional.of(register));
        when(fiscalDriveSettingsRepository.findById(11L)).thenReturn(Optional.of(
            CashRegisterFiscalDriveSettings.builder().ownerTin("200523221").terminalId("ZZ000000000000").build()
        ));
        when(client.validate(any())).thenReturn(MarkingValidationResponse.valid());

        assertThat(service.validate(request(true)).status()).isEqualTo(MarkingValidationResponse.Status.VALID);

        ArgumentCaptor<OnkmValidationRequest> sent = ArgumentCaptor.forClass(OnkmValidationRequest.class);
        verify(client).validate(sent.capture());
        verify(tenantAccess).assertCanAccessStore(store);
        assertThat(sent.getValue().ownerTin()).isEqualTo("200523221");
        assertThat(sent.getValue().terminalId()).isEqualTo("ZZ000000000000");
        assertThat(sent.getValue().refund()).isEqualTo(1);
        OnkmValidationRequest.Product product = sent.getValue().products().get(0);
        assertThat(product.packageCode()).isEqualTo("1077302");
        assertThat(product.fullKmIds()).isNull();
        assertThat(product.commitentTin()).isNull();
    }

    @Test
    void missingFiscalDriveSettingsIsBadRequest() {
        when(cashRegisterRepository.findById(11L)).thenReturn(Optional.of(register));
        when(fiscalDriveSettingsRepository.findById(11L)).thenReturn(Optional.of(
            CashRegisterFiscalDriveSettings.builder().ownerTin("200523221").build()
        ));

        assertThatThrownBy(() -> service.validate(request(false))).isInstanceOf(BadRequestException.class);
        verifyNoInteractions(client);
    }
}
