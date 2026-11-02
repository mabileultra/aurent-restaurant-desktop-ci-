package com.pos.scales.service.impl;

import com.pos.catalog.api.CatalogFacade;
import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.dto.ref.WeightProductRef;
import com.pos.catalog.repository.ProductStorePriceRepository;
import com.pos.catalog.service.ProductService;
import com.pos.catalog.service.product.ProductResponseAssembler;
import com.pos.catalog.service.product.support.ProductPluValidator;
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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScaleProductServiceImpl implements ScaleProductService {

    private final CatalogFacade catalogFacade;
    private final ProductService productService;
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
        return catalogFacade.listActiveWeightProducts(companyId).stream()
            .map(scaleProductMapper::toDto)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getByPlu(String plu, Integer storeId) {
        WeightProductRef weight = requireWeight(plu);
        return forStore(productService.getProduct(weight.id(), storeId), weight, storeId);
    }

    @Override
    @Transactional
    public ProductResponse assignPlu(AssignPluRequest request) {
        WeightProductRef saved = catalogFacade.assignWeightPlu(request.productId(), request.plu());
        return productService.getProduct(saved.id(), null);
    }

    @Override
    @Transactional(readOnly = true)
    public EncodeWeightBarcodeResponse encode(EncodeWeightBarcodeRequest request) {
        requireWeight(request.plu());
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
        WeightProductRef weight = requireWeight(decoded.plu());
        ProductResponse response = forStore(productService.getProduct(weight.id(), storeId), weight, storeId);
        return new DecodeWeightBarcodeResponse(decoded.barcode(), decoded.plu(), decoded.weightKg(), response);
    }

    private WeightProductRef requireWeight(String plu) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        return catalogFacade.requireActiveWeightByPlu(companyId, plu);
    }

    private ProductResponse forStore(ProductResponse base, WeightProductRef weight, Integer storeId) {
        if (storeId == null) {
            return base;
        }
        if (productStorePriceRepository.findByProduct_IdAndStore_Id(weight.id(), storeId).isEmpty()) {
            throw PosExceptions.badRequest("Product is not available in this store");
        }
        BigDecimal qty = storeStockService.getQuantity(weight.id(), storeId);
        ProductResponse withQty = assembler.withStockQuantity(base, qty);
        BigDecimal price = productStorePriceRepository
            .findByProduct_IdAndStore_Id(weight.id(), storeId)
            .map(sp -> sp.getPrice())
            .orElse(weight.sellingPrice());
        return assembler.withSellingPrice(withQty, price);
    }
}
