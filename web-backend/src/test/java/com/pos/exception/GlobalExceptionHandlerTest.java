package com.pos.exception;

import com.pos.shared.api.ApiErrorResponse;
import com.pos.integrations.fiscal.support.FiscalModuleField;
import com.pos.integrations.fiscal.support.InMemoryFiscalModuleOwners;
import com.pos.sales.entity.CashRegister;
import com.pos.entity.Company;
import com.pos.entity.Store;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(handler, "includeContextInResponse", false);
        request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/v1/reports/stock/dashboard");
        when(request.getMethod()).thenReturn("GET");
        when(request.getQueryString()).thenReturn("from=2026-05-01&to=2026-05-07");
    }

    @Test
    void notFound_returnsCodeAndMessage() {
        var ex = PosExceptions.notFound("Product", "550e8400-e29b-41d4-a716-446655440000");

        ResponseEntity<ApiErrorResponse> res = handler.handleNotFound(ex, request);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().code()).isEqualTo("NOT_FOUND");
        assertThat(res.getBody().message()).contains("Product not found");
        assertThat(res.getBody().path()).isEqualTo("/api/v1/reports/stock/dashboard");
        assertThat(res.getBody().context()).isNull();
    }

    @Test
    void badRequest_withContext_includedWhenFlagEnabled() {
        ReflectionTestUtils.setField(handler, "includeContextInResponse", true);
        var ex = PosExceptions.badRequest("SKU already exists", "sku", "ABC-1");

        ResponseEntity<ApiErrorResponse> res = handler.handleBadRequest(ex, request);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody().code()).isEqualTo("BAD_REQUEST");
        assertThat(res.getBody().context()).containsEntry("sku", "ABC-1");
    }

    @Test
    void internalError_hidesDetailsByDefault() {
        ResponseEntity<ApiErrorResponse> res = handler.handleGeneral(
            new ClassCastException("nested Object[]"),
            request
        );

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(res.getBody().code()).isEqualTo("INTERNAL_ERROR");
        assertThat(res.getBody().message()).isEqualTo("An unexpected error occurred");
        assertThat(res.getBody().context()).isNull();
    }

    @Test
    void fiscalModuleConflict_foreignCompanyDetailsNotLeakedEvenWithContextEnabled() {
        ReflectionTestUtils.setField(handler, "includeContextInResponse", true);
        ConflictException ex = fiscalModuleConflict(2);

        ResponseEntity<ApiErrorResponse> res = handler.handleConflict(ex, request);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(res.getBody().message())
            .isEqualTo("Фискальный модуль «YZ1» уже привязан к кассе другой компании");
        assertThat(res.getBody().context())
            .containsOnlyKeys("field", "conflictField", "conflictScope")
            .containsEntry("conflictScope", "OTHER_COMPANY");
        assertThat(res.getBody().toString()).doesNotContain("Чужой магазин").doesNotContain("№7");
    }

    @Test
    void fiscalModuleConflict_sameCompanyContextReturnedWhenFlagEnabled() {
        ReflectionTestUtils.setField(handler, "includeContextInResponse", true);
        ConflictException ex = fiscalModuleConflict(1);

        ResponseEntity<ApiErrorResponse> res = handler.handleConflict(ex, request);

        assertThat(res.getBody().message())
            .isEqualTo("Фискальный модуль «YZ1» уже привязан к кассе №7 (Магазин: «Чужой магазин»)");
        assertThat(res.getBody().context())
            .containsEntry("conflictRegisterId", 3L)
            .containsEntry("conflictRegisterNumber", 7)
            .containsEntry("conflictStoreName", "Чужой магазин");
    }

    /** Касса №7 (id=3) компании 2 владеет ФМ «YZ1»; сохраняем кассу id=1 компании {@code currentCompanyId}. */
    private static ConflictException fiscalModuleConflict(int currentCompanyId) {
        com.pos.entity.Store store = Store.builder()
            .id(30).name("Чужой магазин").active(true)
            .company(Company.builder().id(currentCompanyId == 1 ? 1 : 9).build())
            .build();
        com.pos.sales.entity.CashRegister owner = CashRegister.builder()
            .id(3L).registerNumber(7).store(store).status("ACTIVE").build();
        var state = new InMemoryFiscalModuleOwners()
            .register(owner)
            .bind(FiscalModuleField.CASH_REGISTER_FISCAL_CARD_ID, 3L, "yz1");
        try {
            state.guard().assertAvailable(
                FiscalModuleField.CASH_REGISTER_FISCAL_CARD_ID,
                "YZ1", 1L, currentCompanyId
            );
        } catch (ConflictException ex) {
            return ex;
        }
        throw new AssertionError("expected ConflictException");
    }
}
