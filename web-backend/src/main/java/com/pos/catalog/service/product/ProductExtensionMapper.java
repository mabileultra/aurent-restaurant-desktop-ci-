package com.pos.catalog.service.product;

import com.pos.catalog.dto.product.RetailExtrasDto;
import com.pos.catalog.dto.product.ServiceProductDetailsDto;
import com.pos.catalog.entity.ServiceProductDetails;
import org.springframework.stereotype.Component;

@Component
public class ProductExtensionMapper {

    public RetailExtrasDto toDto(com.pos.catalog.entity.RetailProductDetails details) {
        return null;
    }

    public ServiceProductDetailsDto toDto(ServiceProductDetails details) {
        if (details == null) {
            return null;
        }
        return new ServiceProductDetailsDto(
            details.getDurationMinutes(),
            details.isRequiresAppointment()
        );
    }
}
