package com.pos.restaurant.store.service.impl;

import com.pos.restaurant.edge.entity.EdgeStore;
import com.pos.restaurant.edge.repository.EdgeStoreRepository;
import com.pos.restaurant.store.dto.InternalStoreUpsertRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CloudStoreMirrorServiceImplTest {

    @Mock private EdgeStoreRepository storeRepository;
    @InjectMocks private CloudStoreMirrorServiceImpl service;

    @Test
    void upsertCreatesRow() {
        when(storeRepository.findById(55)).thenReturn(Optional.empty());
        service.upsert(new InternalStoreUpsertRequest(
            55, 61, "Alinur Garden", null, null, null, "RESTAURANT", true
        ));
        ArgumentCaptor<EdgeStore> cap = ArgumentCaptor.forClass(EdgeStore.class);
        verify(storeRepository).save(cap.capture());
        assertThat(cap.getValue().getId()).isEqualTo(55);
        assertThat(cap.getValue().getCompanyId()).isEqualTo(61);
        assertThat(cap.getValue().getName()).isEqualTo("Alinur Garden");
        assertThat(cap.getValue().isActive()).isTrue();
    }

    @Test
    void deactivateMarksInactive() {
        EdgeStore row = EdgeStore.builder()
            .id(55).companyId(61).name("A").businessType("RESTAURANT").active(true).build();
        when(storeRepository.findById(55)).thenReturn(Optional.of(row));
        service.deactivate(55);
        assertThat(row.isActive()).isFalse();
        verify(storeRepository).save(row);
    }
}
