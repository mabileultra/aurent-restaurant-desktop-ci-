package com.pos.scales.service.impl;

import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.repository.ProductStorePriceRepository;
import com.pos.domain.SaleType;
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

    private final ProductRepository productRepository;
    private final ProductStorePriceRepository productStorePriceRepository;
    private final TenantAccessSupport tenantAccess;

    @Override
    @Transactional(readOnly = true)
    public ScalePluExportResponse exportPluCatalog(boolean onlyWithPlu, Integer storeId) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        List<Product> products = productRepository.findActiveByCompanyAndSaleType(companyId, SaleType.WEIGHT);

        List<ScalePluExportItemDto> items = new ArrayList<>();
        int withPlu = 0;
        for (Product product : products) {
            String plu = StringUtils.hasText(product.getPlu()) ? product.getPlu().trim() : null;
            if (plu != null) {
                withPlu++;
            } else if (onlyWithPlu) {
                continue;
            }
            BigDecimal price = resolvePrice(product, storeId);
            items.add(new ScalePluExportItemDto(
                product.getId(),
                plu,
                product.getName(),
                product.getSku(),
                price,
                product.getUnitCode() != null ? product.getUnitCode().name() : "KG"
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

    private BigDecimal resolvePrice(Product product, Integer storeId) {
        if (storeId == null) {
            return product.getSellingPrice();
        }
        return productStorePriceRepository
            .findByProduct_IdAndStore_Id(product.getId(), storeId)
            .map(sp -> sp.getPrice())
            .orElse(product.getSellingPrice());
    }
}
