package com.pos.sales.service.sale.support;

import com.pos.exception.BadRequestException;
import com.pos.integrations.multikassa.entity.CashRegisterMultikassaSettings;
import com.pos.integrations.multikassa.service.MultikassaSettingsService;
import com.pos.sales.dto.sale.SaleFiscalPayload;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.entity.CashierShift;
import com.pos.sales.entity.Sale;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SaleFiscalApplierTest {

    @Mock
    private MultikassaSettingsService multikassaSettingsService;

    @InjectMocks
    private SaleFiscalApplier applier;

    @Test
    void apply_withoutSettingsAndNullFiscal_setsNotRequired() {
        Sale sale = new Sale();
        CashierShift shift = shiftWithRegister(10L);
        when(multikassaSettingsService.findEnabledByCashRegisterId(10L)).thenReturn(Optional.empty());

        applier.apply(sale, shift, null);

        assertThat(sale.getFiscalStatus()).isEqualTo(SaleFiscalApplier.STATUS_NOT_REQUIRED);
        assertThat(sale.getFiscalSign()).isNull();
        assertThat(sale.getFiscalQrUrl()).isNull();
    }

    @Test
    void apply_enabledRequireBeforeSale_rejectsMissingFiscal() {
        Sale sale = new Sale();
        CashierShift shift = shiftWithRegister(11L);
        when(multikassaSettingsService.findEnabledByCashRegisterId(11L))
            .thenReturn(Optional.of(enabledSettings(true)));

        assertThatThrownBy(() -> applier.apply(sale, shift, null))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("фискализация");
    }

    @Test
    void apply_enabledRequireBeforeSale_rejectsPendingWithoutProof() {
        Sale sale = new Sale();
        CashierShift shift = shiftWithRegister(12L);
        when(multikassaSettingsService.findEnabledByCashRegisterId(12L))
            .thenReturn(Optional.of(enabledSettings(true)));

        SaleFiscalPayload pending = new SaleFiscalPayload(
            SaleFiscalApplier.STATUS_PENDING,
            null,
            null,
            null,
            null,
            "module down",
            null
        );

        assertThatThrownBy(() -> applier.apply(sale, shift, pending))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    void apply_enabledRequireBeforeSale_acceptsFiscalizedWithQrAndTerminal() {
        Sale sale = new Sale();
        CashierShift shift = shiftWithRegister(13L);
        when(multikassaSettingsService.findEnabledByCashRegisterId(13L))
            .thenReturn(Optional.of(enabledSettings(true)));

        SaleFiscalPayload fiscal = new SaleFiscalPayload(
            SaleFiscalApplier.STATUS_FISCALIZED,
            "ABC123SIGN",
            "42",
            "mk-sale-1",
            "https://ofd.soliq.uz/check?t=TERM1&r=42&c=20260907120000&s=ABC123SIGN",
            null,
            "TERM1"
        );

        applier.apply(sale, shift, fiscal);

        assertThat(sale.getFiscalStatus()).isEqualTo(SaleFiscalApplier.STATUS_FISCALIZED);
        assertThat(sale.getFiscalSign()).isEqualTo("ABC123SIGN");
        assertThat(sale.getFiscalQrUrl()).contains("ofd.soliq.uz");
        assertThat(sale.getFiscalTerminalId()).isEqualTo("TERM1");
        assertThat(sale.getFiscalizedAt()).isNotNull();
    }

    @Test
    void apply_enabledWithoutRequire_stillRequiresFiscalOnline() {
        Sale sale = new Sale();
        CashierShift shift = shiftWithRegister(14L);
        when(multikassaSettingsService.findEnabledByCashRegisterId(14L))
            .thenReturn(Optional.of(enabledSettings(false)));

        SaleFiscalPayload pending = new SaleFiscalPayload(
            SaleFiscalApplier.STATUS_PENDING,
            null,
            null,
            null,
            null,
            "offline",
            null
        );

        assertThatThrownBy(() -> applier.apply(sale, shift, pending))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    void apply_enabledOfflineSync_allowsPending() {
        Sale sale = new Sale();
        CashierShift shift = shiftWithRegister(16L);
        when(multikassaSettingsService.findEnabledByCashRegisterId(16L))
            .thenReturn(Optional.of(enabledSettings(true)));

        SaleFiscalPayload pending = new SaleFiscalPayload(
            SaleFiscalApplier.STATUS_PENDING,
            null,
            null,
            null,
            null,
            "offline",
            null
        );

        applier.apply(sale, shift, pending, false);

        assertThat(sale.getFiscalStatus()).isEqualTo(SaleFiscalApplier.STATUS_PENDING);
        assertThat(sale.getFiscalQrUrl()).isNull();
    }

    @Test
    void apply_rejectsSyntheticMkSignWhenRequired() {
        Sale sale = new Sale();
        CashierShift shift = shiftWithRegister(15L);
        when(multikassaSettingsService.findEnabledByCashRegisterId(15L))
            .thenReturn(Optional.of(enabledSettings(true)));

        SaleFiscalPayload fake = new SaleFiscalPayload(
            SaleFiscalApplier.STATUS_FISCALIZED,
            "MK-12345",
            "1",
            "id",
            null,
            null,
            "TERM"
        );

        assertThatThrownBy(() -> applier.apply(sale, shift, fake))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Поддельный");
    }

    private static CashierShift shiftWithRegister(Long registerId) {
        CashRegister register = CashRegister.builder().id(registerId).build();
        return CashierShift.builder().cashRegister(register).build();
    }

    private static CashRegisterMultikassaSettings enabledSettings(boolean requireBeforeSale) {
        return CashRegisterMultikassaSettings.builder()
            .enabled(true)
            .baseUrl("http://localhost:8080")
            .requireBeforeSale(requireBeforeSale)
            .build();
    }
}
