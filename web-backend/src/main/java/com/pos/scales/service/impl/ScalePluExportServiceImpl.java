package com.pos.scales.service.impl;

import com.pos.catalog.api.CatalogFacade;
import com.pos.catalog.dto.ref.WeightProductRef;
import com.pos.catalog.repository.ProductStorePriceRepository;
import com.pos.scales.domain.ScaleLabelProfile;
import com.pos.scales.dto.ScalePluExportItemDto;
import com.pos.scales.dto.ScalePluExportResponse;
import com.pos.scales.service.ScalePluExportService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScalePluExportServiceImpl implements ScalePluExportService {

    private final CatalogFacade catalogFacade;
    private final ProductStorePriceRepository productStorePriceRepository;
    private final TenantAccessSupport tenantAccess;

    @Override
    @Transactional(readOnly = true)
    public ScalePluExportResponse exportPluCatalog(boolean onlyWithPlu, Integer storeId) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        List<WeightProductRef> products = catalogFacade.listActiveWeightProducts(companyId);

        List<ScalePluExportItemDto> items = new ArrayList<>();
        int withPlu = 0;
        for (WeightProductRef product : products) {
            String plu = StringUtils.hasText(product.plu()) ? product.plu().trim() : null;
            if (plu != null) {
                withPlu++;
            } else if (onlyWithPlu) {
                continue;
            }
            BigDecimal price = resolvePrice(product, storeId);
            items.add(new ScalePluExportItemDto(
                product.id(),
                plu,
                product.name(),
                product.sku(),
                price,
                product.unitCode() != null ? product.unitCode() : "KG"
            ));
        }

        LogUtil.info(
            ScalePluExportServiceImpl.class,
            "PLU export: companyId={}, total={}, withPlu={}, onlyWithPlu={}",
            companyId,
            items.size(),
            withPlu,
            onlyWithPlu
        );

        return new ScalePluExportResponse(
            ScaleLabelProfile.AURENT_20_WEIGHT,
            Instant.now(),
            items.size(),
            withPlu,
            List.copyOf(items)
        );
    }

    private BigDecimal resolvePrice(WeightProductRef product, Integer storeId) {
        if (storeId == null) {
            return product.sellingPrice();
        }
        return productStorePriceRepository
            .findByProduct_IdAndStore_Id(product.id(), storeId)
            .map(sp -> sp.getPrice())
            .orElse(product.sellingPrice());
    }
}
