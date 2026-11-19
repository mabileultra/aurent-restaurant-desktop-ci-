package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacySaleErrors;
import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import com.pos.pharmacy.sales.dto.SaleItemRequest;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptSupport;
import com.pos.shared.log.LogUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * AUR-18: номер электронного рецепта в продаже.
 * <p>
 * Номер обязателен, если в чеке есть товар с атрибутом {@code prescription_required = true};
 * формат после trim — {@code ^[A-Za-z0-9/-]{4,64}$}. Касса отправляет продажу уже после пробития чека,
 * поэтому 400 включается флагом {@code app.pharmacy.sales.prescription-number-enforced}, когда все кассы
 * отправляют номер. Без флага и в офлайн-синхронизации продажа сохраняется (неверный номер — без него)
 * и пишется WARN без значения номера.
 */
@Component
public class PharmacySalePrescriptionGuard {

    private static final Pattern NUMBER = Pattern.compile("[A-Za-z0-9/-]{4,64}");
    private static final String TRUE = "true";

    private final boolean enforced;

    public PharmacySalePrescriptionGuard(
        @Value("${app.pharmacy.sales.prescription-number-enforced:false}") boolean enforced
    ) {
        this.enforced = enforced;
    }

    /**
     * @return номер для сохранения в продаже или {@code null}
     */
    public String resolve(
        CreateSaleRequest req,
        Map<UUID, Map<String, String>> attributesByProductId,
        OfflineSaleContext offline
    ) {
        String number = req.prescriptionNumber() == null ? null : req.prescriptionNumber().trim();
        if (number != null && number.isEmpty()) {
            number = null;
        }
        PharmacySaleErrors issue = null;
        if (number != null && !NUMBER.matcher(number).matches()) {
            issue = PharmacySaleErrors.PHARM_SALE_PRESCRIPTION_NUMBER_INVALID;
        } else if (number == null && hasPrescriptionItem(req, attributesByProductId)) {
            issue = PharmacySaleErrors.PHARM_SALE_PRESCRIPTION_NUMBER_REQUIRED;
        }
        if (issue == null) {
            return number;
        }
        if (enforced && offline == null) {
            throw PharmacyErrors.of(issue);
        }
        LogUtil.warn(
            PharmacySalePrescriptionGuard.class,
            "Pharmacy sale saved without prescription number: issue={}, storeId={}, clientSaleId={}",
            issue,
            req.storeId(),
            offline == null ? null : offline.clientSaleId()
        );
        return null;
    }

    private static boolean hasPrescriptionItem(
        CreateSaleRequest req,
        Map<UUID, Map<String, String>> attributesByProductId
    ) {
        if (req.items() == null || attributesByProductId == null) {
            return false;
        }
        for (SaleItemRequest item : req.items()) {
            Map<String, String> attributes = attributesByProductId.get(item.productId());
            String flag = attributes == null ? null : attributes.get(PharmacyReceiptSupport.ATTR_PRESCRIPTION_REQUIRED);
            if (flag != null && TRUE.equalsIgnoreCase(flag.trim())) {
                return true;
            }
        }
        return false;
    }
}
