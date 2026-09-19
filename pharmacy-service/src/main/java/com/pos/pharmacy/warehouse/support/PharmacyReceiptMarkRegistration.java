package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.marks.dto.StockMarkRegisterItem;
import com.pos.pharmacy.marks.dto.StockMarkRegisterRequest;
import com.pos.pharmacy.marks.service.PharmacyStockMarkService;
import com.pos.pharmacy.warehouse.dto.PharmacyReceiptActivateRequest;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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
     * КМ на приходе необязательны. Проверяем только дубликаты переданных кодов.
     */
    public void validateMarkedProducts(
        StockReceipt receipt,
        List<PharmacyReceiptActivateRequest.PharmacyReceiptMarkItem> marks
    ) {
        if (receipt == null || marks == null || marks.isEmpty()) {
            return;
        }
        Set<String> seenCodes = new HashSet<>();
        for (PharmacyReceiptActivateRequest.PharmacyReceiptMarkItem mark : marks) {
            if (mark == null || mark.productId() == null || !StringUtils.hasText(mark.markCode())) {
                continue;
            }
            String code = mark.markCode().trim();
            if (!seenCodes.add(code.toLowerCase())) {
                throw PharmacyErrors.badRequest("В приходе повторён один и тот же код маркировки");
            }
        }
    }
}
