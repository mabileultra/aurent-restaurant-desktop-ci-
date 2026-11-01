package com.pos.integrations.restaurant.support;

import com.pos.client.restaurant.RestaurantStoreMirrorClient;
import com.pos.entity.Company;
import com.pos.entity.Store;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RestaurantStoreMirrorNotifierTest {

    @Mock private RestaurantStoreMirrorClient client;
    @InjectMocks private RestaurantStoreMirrorNotifier notifier;

    @Test
    void mirrorsRestaurantStore() {
        Store store = Store.builder()
            .id(55)
            .name("Alinur")
            .businessType("RESTAURANT")
            .active(true)
            .company(Company.builder().id(61).name("Co").loginCode("88551").build())
            .build();
        notifier.afterSave(store);
        verify(client).upsert(eq(55), eq(61), eq("Alinur"), eq(null), eq(null), eq(null), eq("RESTAURANT"), eq(true));
    }

    @Test
    void deactivatesNonRestaurant() {
        Store store = Store.builder()
            .id(10)
            .name("Shop")
            .businessType("GROCERY")
            .active(true)
            .company(Company.builder().id(1).name("Co").loginCode("1").build())
            .build();
        notifier.afterSave(store);
        verify(client).deactivate(10);
        verify(client, never()).upsert(anyInt(), anyInt(), anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean());
    }
}
