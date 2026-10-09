package com.pos.restaurant.menu.support;

import com.pos.restaurant.menu.dto.SaveMenuItemRequest;
import com.pos.restaurant.menu.entity.MenuItem;
import org.springframework.stereotype.Component;

/** Writes Tasnif fields from the dish form onto the menu item. */
@Component
public class MenuItemFiscalApplier {

    public void apply(MenuItem item, SaveMenuItemRequest request) {
        item.setIkpu(blankToNull(request.ikpu()));
        item.setPackageCode(blankToNull(request.packageCode()));
        item.setUnitOfMeasure(blankToNull(request.unitOfMeasure()));
        item.setUnitMeasureCode(blankToNull(request.unitMeasureCode()));
        item.setBarcode(blankToNull(request.barcode()));
        item.setMarkedProduct(Boolean.TRUE.equals(request.markedProduct()));
    }

    public void copyFrom(MenuItem target, MenuItem source) {
        target.setIkpu(source.getIkpu());
        target.setPackageCode(source.getPackageCode());
        target.setUnitOfMeasure(source.getUnitOfMeasure());
        target.setUnitMeasureCode(source.getUnitMeasureCode());
        target.setBarcode(source.getBarcode());
        target.setMarkedProduct(source.isMarkedProduct());
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
