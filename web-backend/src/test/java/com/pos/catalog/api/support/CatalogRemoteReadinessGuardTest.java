package com.pos.catalog.api.support;

import com.pos.client.catalog.CatalogRemoteStats;
import com.pos.client.catalog.CatalogServiceClient;
import com.pos.config.catalog.CatalogReadMode;
import com.pos.config.catalog.CatalogServiceProperties;
import com.pos.exception.ServiceUnavailableException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogRemoteReadinessGuardTest {

    @Mock
    private CatalogServiceProperties properties;
    @Mock
    private CatalogServiceClient catalogServiceClient;
    @InjectMocks
    private CatalogRemoteReadinessGuard guard;

    @Test
    void remoteOnlyUnreachableThrows() {
        when(properties.isEnabled()).thenReturn(true);
        when(properties.effectiveReadMode()).thenReturn(CatalogReadMode.REMOTE_ONLY);
        when(catalogServiceClient.fetchStats(isNull())).thenReturn(Optional.empty());
        assertThrows(ServiceUnavailableException.class, guard::requireReachableForRemoteOnlyReads);
    }

    @Test
    void remoteFirstSkipsGuard() {
        when(properties.isEnabled()).thenReturn(true);
        when(properties.effectiveReadMode()).thenReturn(CatalogReadMode.REMOTE_FIRST);
        assertDoesNotThrow(guard::requireReachableForRemoteOnlyReads);
    }

    @Test
    void remoteOnlyReachableOk() {
        when(properties.isEnabled()).thenReturn(true);
        when(properties.effectiveReadMode()).thenReturn(CatalogReadMode.REMOTE_ONLY);
        when(catalogServiceClient.fetchStats(isNull())).thenReturn(Optional.of(
            new CatalogRemoteStats(null, 1, 1, 0)
        ));
        assertDoesNotThrow(guard::requireReachableForRemoteOnlyReads);
    }
}
