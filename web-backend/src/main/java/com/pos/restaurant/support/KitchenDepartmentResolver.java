package com.pos.restaurant.support;

import com.pos.service.ProductAttributeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class KitchenDepartmentResolver {

    public static final String ATTR_KEY = "kitchen_department";
    public static final String NONE = "NONE";
    public static final String DEFAULT_DEPARTMENT = "GENERAL";

    private final ProductAttributeService productAttributeService;

    public String resolve(UUID productId) {
        String value = productAttributeService.getAttributes(productId).get(ATTR_KEY);
        if (!StringUtils.hasText(value)) {
            return DEFAULT_DEPARTMENT;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    public boolean isKitchenRoutable(String department) {
        if (!StringUtils.hasText(department)) {
            return true;
        }
        return !NONE.equalsIgnoreCase(department.trim());
    }
}
