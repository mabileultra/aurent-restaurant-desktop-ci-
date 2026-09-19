package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PharmacyImportTasnifEnricherTest {

    @Test
    void invoiceOnlyWhenTasnifDisabled() {
        PharmacyImportTasnifLookup lookup = mock(PharmacyImportTasnifLookup.class);
        when(lookup.byMxik("03004409005052001")).thenReturn(null);
        PharmacyImportTasnifEnricher enricher = new PharmacyImportTasnifEnricher(lookup);
        PharmacyImportCatalogHints hints = enricher.apply("03004409005052001", false, Boolean.TRUE);
        assertFalse(hints.markedProduct());
        assertEquals(Boolean.TRUE, hints.prescriptionRequired());
        assertNull(hints.packageCode());
        assertEquals("MANUAL", hints.ikpuStatus());
    }

    @Test
    void marksWhenMxikNotFound() {
        PharmacyImportTasnifLookup lookup = mock(PharmacyImportTasnifLookup.class);
        when(lookup.byMxik("03004409005052001")).thenReturn(PharmacyImportTasnifHit.miss());
        PharmacyImportTasnifEnricher enricher = new PharmacyImportTasnifEnricher(lookup);
        PharmacyImportCatalogHints hints = enricher.apply("03004409005052001", false, null);
        assertTrue(hints.markedProduct());
        assertNull(hints.prescriptionRequired());
        assertNull(hints.packageCode());
        assertEquals("MANUAL", hints.ikpuStatus());
    }

    @Test
    void usesTasnifLabelAndSinglePackage() {
        PharmacyImportTasnifLookup lookup = mock(PharmacyImportTasnifLookup.class);
        when(lookup.byMxik("03004409005052001")).thenReturn(
            new PharmacyImportTasnifHit(true, true, "1546940", "Кюпен рецептсиз")
        );
        PharmacyImportTasnifEnricher enricher = new PharmacyImportTasnifEnricher(lookup);
        PharmacyImportCatalogHints hints = enricher.apply("03004409005052001", false, null);
        assertTrue(hints.markedProduct());
        assertEquals(Boolean.FALSE, hints.prescriptionRequired());
        assertEquals("1546940", hints.packageCode());
        assertEquals("FOUND", hints.ikpuStatus());
    }

    @Test
    void invoiceRxWinsOverTasnif() {
        PharmacyImportTasnifLookup lookup = mock(PharmacyImportTasnifLookup.class);
        when(lookup.byMxik("03004409005052001")).thenReturn(
            new PharmacyImportTasnifHit(true, false, "1546940", "рецептсиз")
        );
        PharmacyImportTasnifEnricher enricher = new PharmacyImportTasnifEnricher(lookup);
        PharmacyImportCatalogHints hints = enricher.apply("03004409005052001", true, Boolean.TRUE);
        assertTrue(hints.markedProduct());
        assertEquals(Boolean.TRUE, hints.prescriptionRequired());
        assertEquals("1546940", hints.packageCode());
        assertEquals("FOUND", hints.ikpuStatus());
    }
}
