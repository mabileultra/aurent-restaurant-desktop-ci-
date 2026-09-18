package com.pos.reporting.service.impl;

import com.pos.reporting.client.PosCacheRefreshClient;
import com.pos.reporting.service.PosCacheRefreshService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PosCacheRefreshServiceImpl implements PosCacheRefreshService {

    private final PosCacheRefreshClient posCacheRefreshClient;

    @Override
    public void refresh() {
        posCacheRefreshClient.refresh();
    }
}
