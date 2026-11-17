package com.pos.sales.service.impl;

import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.exception.ConflictException;
import com.pos.integrations.fiscal.support.FiscalModuleField;
import com.pos.integrations.fiscal.support.InMemoryFiscalModuleOwners;
import com.pos.repository.StoreRepository;
import com.pos.sales.dto.cashregister.UpsertCashRegisterRequest;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.mapper.CashRegisterMapper;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.sales.support.CashRegisterStatusToggle;
import com.pos.service.support.TenantAccessSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** AUR-19: fiscal_card_id в карточке кассы (POST/PUT /cash-registers). */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CashRegisterServiceImplTest {

    private static final long NEW_REGISTER_ID = 30L;

    @Mock private CashRegisterRepository cashRegisterRepository;
    @Mock private StoreRepository storeRepository;
    @Mock private CashRegisterMapper cashRegisterMapper;
    @Mock private TenantAccessSupport tenantAccess;
    @Mock private CashRegisterStatusToggle cashRegisterStatusToggle;

    private InMemoryFiscalModuleOwners fm;
    private CashRegisterServiceImpl service;
    private Store store;
    private CashRegister first;
    private CashRegister second;

    @BeforeEach
    void setUp() {
        store = Store.builder().id(10).name("Центральный").active(true)
            .company(Company.builder().id(1).build()).build();
        first = CashRegister.builder().id(1L).store(store).registerNumber(1).status("ACTIVE").build();
        second = CashRegister.builder().id(2L).store(store).registerNumber(2).status("ACTIVE")
            .equipmentModel("old-model").build();
        fm = new InMemoryFiscalModuleOwners().register(first).register(second);
        service = new CashRegisterServiceImpl(
            cashRegisterRepository, storeRepository, cashRegisterMapper, tenantAccess,
            cashRegisterStatusToggle, fm.guard()
        );

        when(storeRepository.findById(10)).thenReturn(Optional.of(store));
        when(cashRegisterRepository.findDetailById(1L)).thenReturn(Optional.of(first));
        when(cashRegisterRepository.findDetailById(2L)).thenReturn(Optional.of(second));
        when(cashRegisterRepository.save(any(CashRegister.class))).thenAnswer(inv -> {
            CashRegister saved = inv.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(NEW_REGISTER_ID);
                fm.register(saved);
            }
            fm.bind(FiscalModuleField.CASH_REGISTER_FISCAL_CARD_ID, saved.getId(), saved.getFiscalCardId());
            return saved;
        });
    }

    @Test
    void createWithFreeModuleSucceeds() {
        service.create(request(3, " YZ1 "));

        verify(cashRegisterRepository).save(any(CashRegister.class));
    }

    @Test
    void createWithModuleOfAnotherRegisterIsConflict() {
        service.update(1L, request(1, "YZ1"));

        ConflictException ex = catchThrowableOfType(() -> service.create(request(3, " yz1 ")), ConflictException.class);

        assertThat(ex.getMessage()).isEqualTo("Фискальный модуль «yz1» уже привязан к кассе №1 (Магазин: «Центральный»)");
    }

    @Test
    void updateSameRegisterWithItsOwnModuleSucceeds() {
        service.update(1L, request(1, "YZ1"));

        assertThatCode(() -> service.update(1L, request(1, " yz1 "))).doesNotThrowAnyException();
        assertThat(first.getFiscalCardId()).isEqualTo("yz1");
    }

    @Test
    void updateAnotherRegisterWithSameModuleIsConflictAndLeavesEntityUntouched() {
        service.update(1L, request(1, "YZ231006044579"));
        UpsertCashRegisterRequest changed = new UpsertCashRegisterRequest(
            10, 2, "new-model", null, "  yz231006044579 ", null, "new-pc"
        );

        ConflictException ex = catchThrowableOfType(() -> service.update(2L, changed), ConflictException.class);

        assertThat(ex.getMessage()).contains("кассе №1").contains("Центральный");
        assertThat(second.getFiscalCardId()).isNull();
        assertThat(second.getEquipmentModel()).isEqualTo("old-model");
        assertThat(second.getWorkstationName()).isNull();
        verify(cashRegisterRepository, never()).save(second);
    }

    @Test
    void unbindingWithNullFreesModuleForAnotherRegister() {
        service.update(1L, request(1, "YZ1"));
        service.update(1L, request(1, null));

        assertThat(first.getFiscalCardId()).isNull();
        assertThatCode(() -> service.update(2L, request(2, "YZ1"))).doesNotThrowAnyException();
        assertThat(second.getFiscalCardId()).isEqualTo("YZ1");
    }

    @Test
    void unbindingWithEmptyStringFreesModuleForAnotherRegister() {
        service.update(1L, request(1, "YZ1"));
        service.update(1L, request(1, "   "));

        assertThatCode(() -> service.update(2L, request(2, " yz1"))).doesNotThrowAnyException();
    }

    private static UpsertCashRegisterRequest request(int registerNumber, String fiscalCardId) {
        return new UpsertCashRegisterRequest(10, registerNumber, null, null, fiscalCardId, null, null);
    }
}
