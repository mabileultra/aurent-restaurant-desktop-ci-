package com.pos.sales.mapper;

import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import com.pos.sales.dto.sale.SaleResponse;
import com.pos.sales.entity.SaleItem;
import com.pos.util.QuantityUtil;
import com.pos.mapper.PosMapperConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.math.BigDecimal;
import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface SaleLineMapper {

    @Mapping(target = "returnableQuantity", source = "item", qualifiedByName = "returnableQty")
    @Mapping(target = "productName", source = "productName")
    @Mapping(target = "saleType", source = "item", qualifiedByName = "saleTypeName")
    @Mapping(target = "unitOfMeasure", source = "item", qualifiedByName = "unitOfMeasure")
    @Mapping(target = "lineDiscount", source = "discount", qualifiedByName = "orZero")
    @Mapping(target = "taxAmount", source = "taxAmount", qualifiedByName = "orZero")
    @Mapping(target = "taxRatePercent", source = "item", qualifiedByName = "taxRate")
    @Mapping(target = "ikpu", source = "ikpu")
    @Mapping(target = "productSku", source = "productSku")
    SaleResponse.SaleLineDto toLineDto(SaleItem item);

    List<SaleResponse.SaleLineDto> toLineDtoList(List<SaleItem> items);

    @Named("returnableQty")
    default BigDecimal returnableQty(SaleItem item) {
        if (item == null) {
            return BigDecimal.ZERO.setScale(QuantityUtil.SCALE);
        }
        BigDecimal left = QuantityUtil.subtract(item.getQuantity(), item.getReturnedQuantity());
        return left.signum() < 0 ? BigDecimal.ZERO.setScale(QuantityUtil.SCALE) : left;
    }

    @Named("saleTypeName")
    default String saleTypeName(SaleItem item) {
        if (item == null || item.getSaleType() == null || item.getSaleType().isBlank()) {
            return SaleType.PIECE.name();
        }
        return item.getSaleType();
    }

    @Named("unitOfMeasure")
    default String unitOfMeasure(SaleItem item) {
        if (item == null) {
            return null;
        }
        if (item.getUnitCode() != null && !item.getUnitCode().isBlank()) {
            try {
                return UnitCode.valueOf(item.getUnitCode().trim()).displayLabel();
            } catch (IllegalArgumentException ignored) {
                // fall through
            }
        }
        String uom = item.getUnitOfMeasure();
        return uom != null && !uom.isBlank() ? uom : "pcs";
    }

    @Named("orZero")
    default BigDecimal orZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    @Named("taxRate")
    default BigDecimal taxRate(SaleItem item) {
        if (item == null || item.getTaxRate() == null) {
            return new BigDecimal("12");
        }
        return item.getTaxRate();
    }
}
