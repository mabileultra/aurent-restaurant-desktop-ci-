package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportConfirmItem;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PharmacyImportProductFactoryTest {

    @Test
    void copiesInvoiceMarkAndPrescriptionOntoNewProduct() {
        ProductRepository repository = mock(ProductRepository.class);
        when(repository.findFirstByCompanyIdAndBarcode(anyInt(), any())).thenReturn(Optional.empty());
        PharmacyImportProductFactory factory = new PharmacyImportProductFactory(repository);
        PharmacyImportConfirmItem item = new PharmacyImportConfirmItem(
            0, null, true, "Кюпен таб", null, null,
            BigDecimal.ONE, BigDecimal.TEN, new BigDecimal("12"), new BigDecimal("11"),
            "UQT", null, "8908", "03004409005052001", BigDecimal.ONE, List.of(),
            true, true, null, null
        );
        var req = factory.request(item, 1, "IS-1", 1);
        assertTrue(req.markedProduct());
        assertEquals("true", req.attributes().get(PharmacyReceiptSupport.ATTR_PRESCRIPTION_REQUIRED));
        assertEquals("MANUAL", req.ikpuStatus());
    }

    @Test
    void leavesUnmarkedWhenInvoiceHasNoFlag() {
        ProductRepository repository = mock(ProductRepository.class);
        PharmacyImportProductFactory factory = new PharmacyImportProductFactory(repository);
        PharmacyImportConfirmItem item = new PharmacyImportConfirmItem(
            1, null, true, "Трусы", null, null,
            BigDecimal.ONE, BigDecimal.TEN, BigDecimal.ZERO, BigDecimal.TEN,
            null, null, null, null, BigDecimal.ONE, List.of(),
            false, false, null, null
        );
        var req = factory.request(item, 1, "IS-1", 1);
        assertFalse(req.markedProduct());
        assertFalse(req.attributes().containsKey(PharmacyReceiptSupport.ATTR_PRESCRIPTION_REQUIRED));
    }

    @Test
    void copiesTasnifPackageAndFoundStatus() {
        ProductRepository repository = mock(ProductRepository.class);
        PharmacyImportProductFactory factory = new PharmacyImportProductFactory(repository);
        PharmacyImportConfirmItem item = new PharmacyImportConfirmItem(
            0, null, true, "Кюпен таб", null, null,
            BigDecimal.ONE, BigDecimal.TEN, new BigDecimal("12"), new BigDecimal("11"),
            "UQT", null, "8908", "03004409005052001", BigDecimal.ONE, List.of(),
            true, true, "1546940", "FOUND"
        );
        var req = factory.request(item, 1, "IS-1", 1);
        assertEquals("FOUND", req.ikpuStatus());
        assertEquals("1546940", req.packageCode());
        assertTrue(req.markedProduct());
    }
}
