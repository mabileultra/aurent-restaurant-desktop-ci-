package com.pos.service.product;

import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.RetailExtrasRequest;
import com.pos.dto.product.ServiceProductDetailsRequest;
import com.pos.dto.product.UpdateProductRequest;
import com.pos.entity.Product;

public interface ProductExtensionService {

    void applyOnCreate(Product product, CreateProductRequest req);

    void applyOnUpdate(Product product, UpdateProductRequest req);

    void applyRetailFlags(Product product, Boolean soldIndividually, Boolean markedProduct);

    void applyService(Product product, ServiceProductDetailsRequest req);

    void applyRetailExtras(Product product, RetailExtrasRequest req);
}
