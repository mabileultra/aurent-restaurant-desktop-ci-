package com.pos.service.product;

import com.pos.dto.product.RetailExtrasDto;
import com.pos.dto.product.ServiceProductDetailsDto;
import com.pos.entity.ServiceProductDetails;
import org.springframework.stereotype.Component;

@Component
public class ProductExtensionMapper {

    public RetailExtrasDto toDto(com.pos.entity.RetailProductDetails details) {
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
