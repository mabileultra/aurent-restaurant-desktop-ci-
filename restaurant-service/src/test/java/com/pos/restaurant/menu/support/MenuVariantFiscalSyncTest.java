package com.pos.restaurant.menu.support;

import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MenuVariantFiscalSyncTest {

    @Mock
    MenuItemRepository itemRepository;

    @Mock
    MenuItemFiscalApplier fiscalApplier;

    @InjectMocks
    MenuVariantFiscalSync sync;

    @Test
    void syncGroupFrom_copiesToSiblingsMissingFiscal() {
        UUID group = UUID.randomUUID();
        MenuItem source = MenuItem.builder()
            .id(UUID.randomUUID())
            .companyId(7)
            .variantGroupId(group)
            .ikpu("032")
            .packageCode("154")
            .build();
        MenuItem sibling = MenuItem.builder()
            .id(UUID.randomUUID())
            .companyId(7)
            .variantGroupId(group)
            .build();
        when(itemRepository.findByCompanyIdAndVariantGroupId(7, group))
            .thenReturn(List.of(source, sibling));

        sync.syncGroupFrom(source);

        verify(fiscalApplier).copyFrom(sibling, source);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<MenuItem>> captor = ArgumentCaptor.forClass(List.class);
        verify(itemRepository).saveAll(captor.capture());
        assertEquals(1, captor.getValue().size());
        assertEquals(sibling.getId(), captor.getValue().get(0).getId());
    }

    @Test
    void syncGroupFrom_repairsBlankSourceFromSiblingDonor() {
        UUID group = UUID.randomUUID();
        MenuItem blank = MenuItem.builder()
            .id(UUID.randomUUID())
            .companyId(7)
            .variantGroupId(group)
            .build();
        MenuItem donor = MenuItem.builder()
            .id(UUID.randomUUID())
            .companyId(7)
            .variantGroupId(group)
            .ikpu("111")
            .packageCode("9")
            .build();
        when(itemRepository.findByCompanyIdAndVariantGroupId(7, group))
            .thenReturn(List.of(blank, donor));

        sync.syncGroupFrom(blank);

        verify(fiscalApplier).copyFrom(blank, donor);
        verify(itemRepository).saveAll(org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void syncGroupFrom_skipsWhenNoGroup() {
        MenuItem source = MenuItem.builder().id(UUID.randomUUID()).companyId(1).ikpu("1").build();
        sync.syncGroupFrom(source);
        verify(itemRepository, never()).findByCompanyIdAndVariantGroupId(
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void syncGroupFrom_skipsWhenNobodyHasIkpu() {
        UUID group = UUID.randomUUID();
        MenuItem a = MenuItem.builder().id(UUID.randomUUID()).companyId(3).variantGroupId(group).build();
        MenuItem b = MenuItem.builder().id(UUID.randomUUID()).companyId(3).variantGroupId(group).build();
        when(itemRepository.findByCompanyIdAndVariantGroupId(3, group)).thenReturn(List.of(a, b));

        sync.syncGroupFrom(a);

        verify(fiscalApplier, never()).copyFrom(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
        verify(itemRepository, never()).saveAll(org.mockito.ArgumentMatchers.anyList());
    }
}
