package com.pos.catalog.service.product;

import com.pos.catalog.dto.product.CreateProductRequest;
import com.pos.catalog.dto.product.RetailExtrasRequest;
import com.pos.catalog.dto.product.ServiceProductDetailsRequest;
import com.pos.catalog.dto.product.UpdateProductRequest;
import com.pos.catalog.entity.Product;

public interface ProductExtensionService {

    void applyOnCreate(Product product, CreateProductRequest req);

    void applyOnUpdate(Product product, UpdateProductRequest req);

    void applyRetailFlags(Product product, Boolean soldIndividually, Boolean markedProduct);

    void applyService(Product product, ServiceProductDetailsRequest req);

    void applyRetailExtras(Product product, RetailExtrasRequest req);
}
