package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCatalogErrors;
import com.pos.pharmacy.sales.dto.SaleItemRequest;
import com.pos.pharmacy.sales.entity.SaleItem;
import com.pos.pharmacy.util.MoneyCalculator;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.support.PharmacyLotFefoSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CheckoutLineAssembler {

    private final CheckoutQuantityResolver checkoutQuantityResolver;

    public record AssembledLines(
        List<SaleItem> items,
        Map<UUID, BigDecimal> quantityByProductId,
        Map<UUID, Product> productsTouched,
        BigDecimal subtotalNet,
        BigDecimal taxTotal,
        BigDecimal lineDiscountTotal
    ) {}

    public AssembledLines assemble(
        List<SaleItemRequest> itemRequests,
        Map<UUID, Product> productsById,
        Map<UUID, Map<String, String>> attributesByProductId
    ) {
        List<SaleItem> items = new ArrayList<>();
        Map<UUID, BigDecimal> quantityByProductId = new LinkedHashMap<>();
        Map<UUID, Product> productsTouched = new LinkedHashMap<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        BigDecimal lineDiscountTotal = BigDecimal.ZERO;

        for (SaleItemRequest itemReq : itemRequests) {
            Product product = productsById.get(itemReq.productId());
            if (product == null) {
                throw PharmacyErrors.notFound(PharmacyCatalogErrors.PHARM_PRODUCT_NOT_FOUND, itemReq.productId());
            }
            BigDecimal lineQty = checkoutQuantityResolver.normalizeQuantity(product, itemReq.quantity(), attributesByProductId);
            checkoutQuantityResolver.validateQuantity(product, lineQty, attributesByProductId);

            BigDecimal lineDiscount = itemReq.discount() != null ? itemReq.discount() : BigDecimal.ZERO;
            BigDecimal unitPrice = resolveCheckoutUnitPrice(itemReq, product);
            BigDecimal lineGross = MoneyCalculator.lineGross(unitPrice, lineQty, lineDiscount);
            BigDecimal rate = product.getTaxRate() != null ? product.getTaxRate() : new BigDecimal("12");
            BigDecimal taxAmt = MoneyCalculator.vatFromInclusiveLine(lineGross, rate);
            BigDecimal netLine = lineGross.subtract(taxAmt);

            SaleItem saleItem = SaleItem.builder()
                .product(product)
                .productName(product.getName())
                .unitPrice(unitPrice)
                .quantity(lineQty)
                .discount(lineDiscount)
                .taxAmount(taxAmt)
                .lineTotal(lineGross)
                .build();
            items.add(saleItem);

            subtotal = subtotal.add(netLine);
            taxTotal = taxTotal.add(taxAmt);
            lineDiscountTotal = lineDiscountTotal.add(lineDiscount);

            productsTouched.put(product.getId(), product);
            quantityByProductId.merge(product.getId(), lineQty, QuantityUtil::add);
        }

        return new AssembledLines(
            items,
            quantityByProductId,
            productsTouched,
            subtotal,
            taxTotal,
            lineDiscountTotal
        );
    }

    private static BigDecimal resolveCheckoutUnitPrice(SaleItemRequest itemReq, Product product) {
        if (itemReq.unitPrice() != null && itemReq.unitPrice().signum() > 0) {
            return itemReq.unitPrice().setScale(2, RoundingMode.HALF_UP);
        }
        return product.getSellingPrice().setScale(2, RoundingMode.HALF_UP);
    }

    /** Builds FEFO needs aligned with assembled sale items (same order). */
    public static List<PharmacyLotFefoSupport.SaleLotNeed> toLotNeeds(AssembledLines assembled) {
        List<PharmacyLotFefoSupport.SaleLotNeed> needs = new ArrayList<>(assembled.items().size());
        for (SaleItem item : assembled.items()) {
            needs.add(new PharmacyLotFefoSupport.SaleLotNeed(item.getProduct(), item.getQuantity(), item));
        }
        return needs;
    }
}
