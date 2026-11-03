package com.pos.catalog.service.impl;

import com.pos.catalog.dto.product.CatalogSyncVerifyResult;
import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.CatalogSyncVerifyService;
import com.pos.client.catalog.CatalogRemoteStats;
import com.pos.client.catalog.CatalogServiceClient;
import com.pos.config.catalog.CatalogServiceProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CatalogSyncVerifyServiceImpl implements CatalogSyncVerifyService {

    private final ProductRepository productRepository;
    private final CatalogServiceClient catalogServiceClient;
    private final CatalogServiceProperties catalogProperties;

    @Override
    @Transactional(readOnly = true)
    public CatalogSyncVerifyResult verify(Integer companyId, int sampleSize) {
        long localTotal;
        long localActive;
        long localInactive;
        if (companyId == null) {
            localTotal = productRepository.count();
            localActive = productRepository.countByIsActiveTrue();
            localInactive = productRepository.countByIsActiveFalse();
        } else {
            localTotal = productRepository.countByCompany_Id(companyId);
            localActive = productRepository.countByCompany_IdAndIsActiveTrue(companyId);
            localInactive = productRepository.countByCompany_IdAndIsActiveFalse(companyId);
        }

        boolean enabled = catalogProperties.isEnabled();
        Optional<CatalogRemoteStats> remoteOpt = enabled
            ? catalogServiceClient.fetchStats(companyId)
            : Optional.empty();

        Long remoteTotal = remoteOpt.map(CatalogRemoteStats::total).orElse(null);
        Long remoteActive = remoteOpt.map(CatalogRemoteStats::active).orElse(null);
        Long remoteInactive = remoteOpt.map(CatalogRemoteStats::inactive).orElse(null);

        long totalDelta = remoteTotal == null ? localTotal : localTotal - remoteTotal;
        long activeDelta = remoteActive == null ? localActive : localActive - remoteActive;
        boolean countsMatch = remoteOpt.isPresent()
            && totalDelta == 0
            && activeDelta == 0;

        int safeSample = Math.min(Math.max(sampleSize, 0), 50);
        List<UUID> missing = new ArrayList<>();
        int checked = 0;
        if (enabled && safeSample > 0) {
            Page<Product> page = productRepository.findForReportingSnapshot(
                companyId,
                PageRequest.of(0, safeSample)
            );
            for (Product product : page.getContent()) {
                checked++;
                if (catalogServiceClient.findById(product.getId()).isEmpty()) {
                    missing.add(product.getId());
                }
            }
        }

        return new CatalogSyncVerifyResult(
            companyId,
            enabled,
            remoteOpt.isPresent(),
            localTotal,
            localActive,
            localInactive,
            remoteTotal,
            remoteActive,
            remoteInactive,
            totalDelta,
            activeDelta,
            countsMatch,
            checked,
            missing.size(),
            List.copyOf(missing)
        );
    }
}
