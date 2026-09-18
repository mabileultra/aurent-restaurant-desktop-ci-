package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.marks.dto.StockMarkRegisterItem;
import com.pos.pharmacy.marks.dto.StockMarkRegisterRequest;
import com.pos.pharmacy.marks.service.PharmacyStockMarkService;
import com.pos.pharmacy.warehouse.dto.PharmacyReceiptActivateRequest;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * После проведения прихода регистрирует КМ на складе.
 * Без marks в запросе не вмешивается (немаркированные приходы как раньше).
 */
@Component
@RequiredArgsConstructor
public class PharmacyReceiptMarkRegistration {

    private final PharmacyStockMarkService stockMarkService;

    /**
     * После проведения прихода регистрирует КМ на складе.
     * validate уже вызван в activate — здесь только запись.
     */
    public void registerAfterActivate(StockReceipt receipt, PharmacyReceiptActivateRequest request) {
        if (receipt == null) {
            return;
        }
        List<PharmacyReceiptActivateRequest.PharmacyReceiptMarkItem> marks =
            request != null && request.marks() != null ? request.marks() : List.of();
        if (marks.isEmpty()) {
            return;
        }

        List<StockMarkRegisterItem> items = new ArrayList<>();
        for (PharmacyReceiptActivateRequest.PharmacyReceiptMarkItem mark : marks) {
            if (mark == null || mark.productId() == null || !StringUtils.hasText(mark.markCode())) {
                throw PharmacyErrors.badRequest("Строка КМ без productId или кода");
            }
            items.add(new StockMarkRegisterItem(
                mark.productId(),
                mark.markCode().trim(),
                null,
                mark.receiptLineId(),
                mark.aslStatus()
            ));
        }

        stockMarkService.registerInStock(new StockMarkRegisterRequest(
            receipt.getStoreId(),
            receipt.getId(),
            items
        ));
        LogUtil.info(
            PharmacyReceiptMarkRegistration.class,
            "Receipt {} registered {} marking codes on stock",
            receipt.getId(),
            items.size()
        );
    }

    /**
     * Для маркированных товаров число КМ должно покрывать количество (упаковки).
     * Если marks пустой и маркированных строк нет — ок.
     */
    public void validateMarkedProducts(
        StockReceipt receipt,
        List<PharmacyReceiptActivateRequest.PharmacyReceiptMarkItem> marks
    ) {
        Map<UUID, Integer> requiredByProduct = new HashMap<>();
        Map<UUID, String> names = new HashMap<>();
        for (StockReceiptLine line : receipt.getLines()) {
            Product product = line.getProduct();
            if (product == null || !product.isMarkedProduct()) {
                continue;
            }
            int packs = packCount(line.getQuantity());
            requiredByProduct.merge(product.getId(), packs, Integer::sum);
            names.put(product.getId(), product.getName());
        }
        if (requiredByProduct.isEmpty()) {
            return;
        }

        Map<UUID, Integer> given = new HashMap<>();
        Set<String> seenCodes = new HashSet<>();
        for (PharmacyReceiptActivateRequest.PharmacyReceiptMarkItem mark : marks) {
            if (mark == null || mark.productId() == null || !StringUtils.hasText(mark.markCode())) {
                continue;
            }
            String code = mark.markCode().trim();
            if (!seenCodes.add(code.toLowerCase())) {
                throw PharmacyErrors.badRequest("В приходе повторён один и тот же код маркировки");
            }
            given.merge(mark.productId(), 1, Integer::sum);
        }

        for (Map.Entry<UUID, Integer> entry : requiredByProduct.entrySet()) {
            int have = given.getOrDefault(entry.getKey(), 0);
            if (have < entry.getValue()) {
                throw PharmacyErrors.badRequest(
                    "Для маркированного товара «"
                        + names.getOrDefault(entry.getKey(), entry.getKey().toString())
                        + "» нужно КМ: "
                        + entry.getValue()
                        + ", передано: "
                        + have
                );
            }
        }
    }

    private static int packCount(BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        return quantity.setScale(0, RoundingMode.UP).intValueExact();
    }
}
