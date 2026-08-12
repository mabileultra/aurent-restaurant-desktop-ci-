package com.pos.scales.service.impl;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.repository.ProductStorePriceRepository;
import com.pos.catalog.service.product.ProductResponseAssembler;
import com.pos.catalog.service.product.support.ProductCatalogLoader;
import com.pos.catalog.service.product.support.ProductPluValidator;
import com.pos.domain.SaleType;
import com.pos.exception.PosExceptions;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.scales.codec.WeightBarcodeCodec;
import com.pos.scales.dto.AssignPluRequest;
import com.pos.scales.dto.DecodeWeightBarcodeResponse;
import com.pos.scales.dto.EncodeWeightBarcodeRequest;
import com.pos.scales.dto.EncodeWeightBarcodeResponse;
import com.pos.scales.dto.ScaleProductDto;
import com.pos.scales.mapper.ScaleProductMapper;
import com.pos.scales.service.ScaleProductService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScaleProductServiceImpl implements ScaleProductService {

    private final ProductRepository productRepository;
    private final ProductCatalogLoader catalogLoader;
    private final ProductResponseAssembler assembler;
    private final ProductStorePriceRepository productStorePriceRepository;
    private final StoreStockService storeStockService;
    private final ProductPluValidator pluValidator;
    private final WeightBarcodeCodec weightBarcodeCodec;
    private final ScaleProductMapper scaleProductMapper;
    private final TenantAccessSupport tenantAccess;

    @Override
    @Transactional(readOnly = true)
    public List<ScaleProductDto> listWeightProducts() {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        return productRepository.findActiveByCompanyAndSaleType(companyId, SaleType.WEIGHT).stream()
            .map(scaleProductMapper::toDto)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getByPlu(String plu, Integer storeId) {
        Product product = requireByPlu(plu);
        return forStore(assembler.toResponse(product), product, storeId);
    }

    @Override
    @Transactional
    public ProductResponse assignPlu(AssignPluRequest request) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Product product = catalogLoader.requireDetailed(request.productId());
        tenantAccess.assertProductBelongsToTenant(product);
        if (product.getSaleType() != SaleType.WEIGHT) {
            throw PosExceptions.badRequest("Only WEIGHT products can have PLU", "saleType", product.getSaleType());
        }

        String plu = pluValidator.normalizeOrNull(request.plu());
        if (plu != null) {
            productRepository.findByCompany_IdAndPlu(companyId, plu)
                .filter(other -> !other.getId().equals(product.getId()))
                .ifPresent(other -> {
                    throw PosExceptions.conflict("PLU already in use", "plu", plu);
                });
        }
        product.setPlu(plu);
        Product saved = productRepository.save(product);
        LogUtil.info(ScaleProductServiceImpl.class, "PLU assigned: productId={}, plu={}", saved.getId(), plu);
        return assembler.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public EncodeWeightBarcodeResponse encode(EncodeWeightBarcodeRequest request) {
        requireByPlu(request.plu());
        String barcode = weightBarcodeCodec.encode(request.plu(), request.weightKg());
        return new EncodeWeightBarcodeResponse(
            barcode,
            pluValidator.requireNormalized(request.plu()),
            request.weightKg()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public DecodeWeightBarcodeResponse decode(String barcode, Integer storeId) {
        WeightBarcodeCodec.DecodedWeightBarcode decoded = weightBarcodeCodec.requireDecode(barcode);
        Product product = requireByPlu(decoded.plu());
        ProductResponse response = forStore(assembler.toResponse(product), product, storeId);
        return new DecodeWeightBarcodeResponse(decoded.barcode(), decoded.plu(), decoded.weightKg(), response);
    }

    private Product requireByPlu(String plu) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        String normalized = pluValidator.requireNormalized(plu);
        Product product = productRepository.findByCompany_IdAndPlu(companyId, normalized)
            .orElseThrow(() -> PosExceptions.notFound("Product for PLU", normalized));
        if (!product.isActive()) {
            throw PosExceptions.badRequest("Product is not active");
        }
        if (product.getSaleType() != SaleType.WEIGHT) {
            throw PosExceptions.badRequest("Product is not a weight item", "saleType", product.getSaleType());
        }
        return product;
    }

    private ProductResponse forStore(ProductResponse base, Product product, Integer storeId) {
        if (storeId == null) {
            return base;
        }
        if (productStorePriceRepository.findByProduct_IdAndStore_Id(product.getId(), storeId).isEmpty()) {
            throw PosExceptions.badRequest("Product is not available in this store");
        }
        BigDecimal qty = storeStockService.getQuantity(product.getId(), storeId);
        ProductResponse withQty = assembler.withStockQuantity(base, qty);
        BigDecimal price = productStorePriceRepository
            .findByProduct_IdAndStore_Id(product.getId(), storeId)
            .map(sp -> sp.getPrice())
            .orElse(product.getSellingPrice());
        return assembler.withSellingPrice(withQty, price);
    }
}
