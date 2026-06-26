package com.pos.service.product.impl;

import com.pos.domain.ProductType;
import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.ServiceProductDetailsRequest;
import com.pos.dto.product.UpdateProductRequest;
import com.pos.entity.Product;
import com.pos.entity.RetailProductDetails;
import com.pos.entity.ServiceProductDetails;
import com.pos.service.product.ProductExtensionService;
import com.pos.service.product.ProductTypeSupport;
import org.springframework.stereotype.Service;

@Service
public class ProductExtensionServiceImpl implements ProductExtensionService {

    @Override
    public void applyOnCreate(Product product, CreateProductRequest req) {
        ProductType type = ProductTypeSupport.resolve(req.productType(), req.saleType());
        product.setProductType(type);
        clearExtensions(product);
        switch (type) {
            case RETAIL -> applyRetailFlags(product, req.soldIndividually(), req.markedProduct());
            case SERVICE -> applyService(product, req.serviceDetails());
            default -> { }
        }
    }

    @Override
    public void applyOnUpdate(Product product, UpdateProductRequest req) {
        if (req.productType() != null && req.productType() != product.getProductType()) {
            product.setProductType(req.productType());
            clearExtensions(product);
        }
        ProductType type = product.getProductType();
        switch (type) {
            case RETAIL -> {
                if (req.soldIndividually() != null || req.markedProduct() != null) {
                    applyRetailFlags(product, req.soldIndividually(), req.markedProduct());
                }
            }
            case SERVICE -> {
                if (req.serviceDetails() != null) {
                    applyService(product, req.serviceDetails());
                }
            }
            default -> { }
        }
    }

    @Override
    public void applyRetailFlags(Product product, Boolean soldIndividually, Boolean markedProduct) {
        boolean sold = soldIndividually == null || soldIndividually;
        boolean marked = Boolean.TRUE.equals(markedProduct);
        product.setSoldIndividually(sold);
        product.setMarkedProduct(marked);

        RetailProductDetails details = product.getRetailDetails();
        if (details == null) {
            details = RetailProductDetails.builder().product(product).build();
            product.setRetailDetails(details);
        }
        details.setSoldIndividually(sold);
        details.setMarkedProduct(marked);
    }

    @Override
    public void applyService(Product product, ServiceProductDetailsRequest req) {
        if (req == null) {
            if (product.getServiceDetails() == null) {
                product.setServiceDetails(ServiceProductDetails.builder().product(product).build());
            }
            return;
        }
        ServiceProductDetails details = product.getServiceDetails();
        if (details == null) {
            details = ServiceProductDetails.builder().product(product).build();
            product.setServiceDetails(details);
        }
        details.setDurationMinutes(req.durationMinutes());
        if (req.requiresAppointment() != null) {
            details.setRequiresAppointment(req.requiresAppointment());
        }
    }

    @Override
    public void applyRetailExtras(Product product, com.pos.dto.product.RetailExtrasRequest req) {
        // Legacy vertical fields migrated to product_attributes.
    }

    private void clearExtensions(Product product) {
        product.setRetailDetails(null);
        product.setServiceDetails(null);
    }
}
