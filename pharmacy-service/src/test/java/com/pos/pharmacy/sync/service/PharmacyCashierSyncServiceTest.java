package com.pos.pharmacy.sync.service;

import com.pos.pharmacy.catalog.service.ProductCatalogService;
import com.pos.pharmacy.shift.support.PharmacyShiftLookup;
import com.pos.pharmacy.sync.dto.OfflineSaleSyncItem;
import com.pos.pharmacy.sync.dto.OfflineSaleSyncResult;
import com.pos.pharmacy.sync.dto.OfflineSalesBatchRequest;
import com.pos.pharmacy.sync.dto.OfflineSalesBatchResponse;
import com.pos.pharmacy.sync.support.PharmacyOfflineSaleSync;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyCashierSyncServiceTest {

    @Mock
    private ProductCatalogService productCatalogService;
    @Mock
    private PharmacyShiftLookup shiftLookup;
    @Mock
    private PharmacyOfflineSaleSync offlineSaleSync;

    @InjectMocks
    private PharmacyCashierSyncService service;

    @Test
    void failedSaleDoesNotStopTheRestOfTheBatch() {
        UUID cashierId = UUID.randomUUID();
        UUID badId = UUID.randomUUID();
        UUID goodId = UUID.randomUUID();
        UUID serverId = UUID.randomUUID();
        OfflineSaleSyncItem bad = item(badId);
        OfflineSaleSyncItem good = item(goodId);

        when(offlineSaleSync.sync(bad, cashierId)).thenThrow(new RuntimeException("no stock"));
        when(offlineSaleSync.sync(good, cashierId)).thenReturn(
            new OfflineSaleSyncResult(goodId, serverId, "R-1", "CREATED", null)
        );

        OfflineSalesBatchResponse response = service.syncSalesBatch(
            new OfflineSalesBatchRequest(List.of(bad, good)),
            cashierId
        );

        assertEquals(2, response.results().size());
        assertEquals("FAILED", response.results().get(0).status());
        assertEquals("no stock", response.results().get(0).errorMessage());
        assertEquals(badId, response.results().get(0).clientSaleId());
        assertEquals("CREATED", response.results().get(1).status());
        assertEquals(serverId, response.results().get(1).serverSaleId());
    }

    private static OfflineSaleSyncItem item(UUID clientSaleId) {
        return new OfflineSaleSyncItem(clientSaleId, "device", Instant.parse("2026-10-05T06:30:06Z"), null, null, null);
    }
}
