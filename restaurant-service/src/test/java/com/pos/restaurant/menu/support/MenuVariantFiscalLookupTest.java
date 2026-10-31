package com.pos.restaurant.menu.support;

import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MenuVariantFiscalLookupTest {

    @Mock
    MenuItemRepository itemRepository;

    @InjectMocks
    MenuVariantFiscalLookup lookup;

    @Test
    void resolve_usesOwnIkpu() {
        UUID group = UUID.randomUUID();
        MenuItem item = MenuItem.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .variantGroupId(group)
            .ikpu("111")
            .packageCode("9")
            .build();

        var fields = lookup.resolve(item, Map.of());
        assertEquals("111", fields.ikpu());
        assertEquals("9", fields.packageCode());
    }

    @Test
    void resolve_fallsBackToSiblingDonor() {
        UUID group = UUID.randomUUID();
        MenuItem without = MenuItem.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .variantGroupId(group)
            .build();
        MenuItem donor = MenuItem.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .variantGroupId(group)
            .ikpu("222")
            .packageCode("15")
            .unitOfMeasure("sht")
            .build();
        when(itemRepository.findByCompanyIdAndVariantGroupIdIn(eq(1), eq(java.util.Set.of(group))))
            .thenReturn(List.of(without, donor));

        Map<UUID, MenuVariantFiscalLookup.FiscalFields> donors = lookup.donorsByGroup(1, List.of(without));
        var fields = lookup.resolve(without, donors);
        assertEquals("222", fields.ikpu());
        assertEquals("15", fields.packageCode());
        assertEquals("sht", fields.unitOfMeasure());
    }

    @Test
    void resolve_noGroup_keepsEmpty() {
        MenuItem item = MenuItem.builder().id(UUID.randomUUID()).companyId(1).build();
        var fields = lookup.resolve(item, Map.of());
        assertNull(fields.ikpu());
    }
}
