package com.pos.pharmacy.sales.support;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.pos.pharmacy.exception.BusinessException;
import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import com.pos.pharmacy.sales.dto.SaleItemRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

/**
 * AUR-18: номер электронного рецепта. Проверка включается флагом: касса отправляет продажу
 * после пробития чека, и 400 до обновления всех касс означал бы потерю продажи.
 */
class PharmacySalePrescriptionGuardTest {

    private static final UUID RX = UUID.randomUUID();
    private static final UUID PLAIN = UUID.randomUUID();
    private static final Map<UUID, Map<String, String>> ATTRIBUTES = Map.of(
        RX, Map.of("prescription_required", "true"),
        PLAIN, Map.of("prescription_required", "false")
    );
    private static final OfflineSaleContext OFFLINE = new OfflineSaleContext(UUID.randomUUID(), "pc-1", Instant.now());

    private final PharmacySalePrescriptionGuard enforced = new PharmacySalePrescriptionGuard(true);
    private final PharmacySalePrescriptionGuard lenient = new PharmacySalePrescriptionGuard(false);
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
    private final Logger logger = (Logger) LoggerFactory.getLogger(PharmacySalePrescriptionGuard.class);

    @BeforeEach
    void captureLogs() {
        logs.start();
        logger.addAppender(logs);
    }

    @AfterEach
    void releaseLogs() {
        logger.detachAppender(logs);
    }

    @Test
    void prescriptionSaleKeepsTrimmedNumber() {
        assertThat(enforced.resolve(request(" RX-2026/001 ", RX), ATTRIBUTES, null)).isEqualTo("RX-2026/001");
    }

    @Test
    void prescriptionSaleWithoutNumberIs400WhenEnforced() {
        BusinessException ex = catchThrowableOfType(
            () -> enforced.resolve(request("  ", RX, PLAIN), ATTRIBUTES, null),
            BusinessException.class
        );

        assertThat(ex.getCode()).isEqualTo("PHARM_SALE_PRESCRIPTION_NUMBER_REQUIRED");
        assertThat(ex.getStatus().value()).isEqualTo(400);
    }

    @Test
    void badFormatIs400WhenEnforced() {
        for (String number : List.of("RX1", "RX 2026", "РЦ-2026", "RX_2026", "A".repeat(65))) {
            BusinessException ex = catchThrowableOfType(
                () -> enforced.resolve(request(number, RX), ATTRIBUTES, null),
                BusinessException.class
            );

            assertThat(ex).as(number).isNotNull();
            assertThat(ex.getCode()).isEqualTo("PHARM_SALE_PRESCRIPTION_NUMBER_INVALID");
            assertThat(ex.getMessage()).doesNotContain(number);
        }
    }

    @Test
    void saleWithoutPrescriptionItemsDoesNotNeedNumber() {
        assertThat(enforced.resolve(request(null, PLAIN), ATTRIBUTES, null)).isNull();
        assertThat(enforced.resolve(request(null, UUID.randomUUID()), Map.of(), null)).isNull();
    }

    @Test
    void notEnforcedSaleIsKeptWithWarnInsteadOf400() {
        assertThat(lenient.resolve(request(null, RX), ATTRIBUTES, null)).isNull();
        assertThat(lenient.resolve(request("РЦ-2026", RX), ATTRIBUTES, null)).isNull();

        assertThat(warnings())
            .contains("PHARM_SALE_PRESCRIPTION_NUMBER_REQUIRED")
            .contains("PHARM_SALE_PRESCRIPTION_NUMBER_INVALID")
            .doesNotContain("РЦ-2026");
    }

    @Test
    void offlineSaleIsNeverRejected() {
        assertThat(enforced.resolve(request(null, RX), ATTRIBUTES, OFFLINE)).isNull();
        assertThat(enforced.resolve(request("RX 1", RX), ATTRIBUTES, OFFLINE)).isNull();
        assertThat(enforced.resolve(request("RX-0001", RX), ATTRIBUTES, OFFLINE)).isEqualTo("RX-0001");

        assertThat(warnings()).contains(OFFLINE.clientSaleId().toString()).doesNotContain("RX 1");
    }

    private String warnings() {
        return logs.list.stream().map(ILoggingEvent::getFormattedMessage).collect(Collectors.joining("\n"));
    }

    private static CreateSaleRequest request(String prescriptionNumber, UUID... productIds) {
        List<SaleItemRequest> items = java.util.Arrays.stream(productIds)
            .map(id -> new SaleItemRequest(id, BigDecimal.ONE, null, null, null))
            .toList();
        return new CreateSaleRequest(
            items, "CASH", 1, null, null, null, null, null, null, prescriptionNumber, null, null, "SALE",
            null, null, null, null, null, null, null, null, null
        );
    }
}
