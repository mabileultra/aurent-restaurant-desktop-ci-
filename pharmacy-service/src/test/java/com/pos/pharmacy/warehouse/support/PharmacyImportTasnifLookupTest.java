package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.config.PharmacyTasnifProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class PharmacyImportTasnifLookupTest {

    @Test
    void skipsWhenDisabledOrShortCode() {
        PharmacyImportTasnifClient client = mock(PharmacyImportTasnifClient.class);
        PharmacyTasnifProperties properties = new PharmacyTasnifProperties();
        properties.setEnabled(false);
        PharmacyImportTasnifLookup lookup = new PharmacyImportTasnifLookup(client, properties);
        assertNull(lookup.byMxik("03004409005052001"));
        verifyNoInteractions(client);

        properties.setEnabled(true);
        assertNull(lookup.byMxik("123"));
        verifyNoInteractions(client);
    }

    @Test
    void cachesFoundHit() {
        PharmacyImportTasnifClient client = mock(PharmacyImportTasnifClient.class);
        PharmacyImportTasnifHit hit = new PharmacyImportTasnifHit(true, true, "1546940", "Кюпен");
        when(client.fetch("03004409005052001")).thenReturn(hit);
        PharmacyTasnifProperties properties = new PharmacyTasnifProperties();
        PharmacyImportTasnifLookup lookup = new PharmacyImportTasnifLookup(client, properties);
        assertSame(hit, lookup.byMxik("03004409005052001"));
        assertSame(hit, lookup.byMxik("03004409005052001"));
        verify(client, times(1)).fetch("03004409005052001");
    }

    @Test
    void doesNotCacheNetworkMiss() {
        PharmacyImportTasnifClient client = mock(PharmacyImportTasnifClient.class);
        when(client.fetch("03004409005052001")).thenReturn(null);
        PharmacyImportTasnifLookup lookup = new PharmacyImportTasnifLookup(client, new PharmacyTasnifProperties());
        assertNull(lookup.byMxik("03004409005052001"));
        assertNull(lookup.byMxik("03004409005052001"));
        verify(client, times(2)).fetch("03004409005052001");
    }
}
