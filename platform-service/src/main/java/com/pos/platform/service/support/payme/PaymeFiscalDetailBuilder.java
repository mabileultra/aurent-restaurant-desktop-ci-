package com.pos.platform.service.support.payme;

import com.pos.platform.config.BillingPaymentProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class PaymeFiscalDetailBuilder {

    private final BillingPaymentProperties paymentProperties;

    public Map<String, Object> build(long amountTiyin) {
        BillingPaymentProperties.Payme payme = paymentProperties.getPayme();
        String title = StringUtils.hasText(payme.getReceiptTitle())
            ? payme.getReceiptTitle().trim()
            : "Пополнение баланса Aurent";
        String ikpu = StringUtils.hasText(payme.getIkpu()) ? payme.getIkpu().trim() : "10305008003000000";
        String packageCode = StringUtils.hasText(payme.getPackageCode())
            ? payme.getPackageCode().trim()
            : "1546532";
        int vat = payme.getVatPercent();

        Map<String, Object> item = new LinkedHashMap<>();
        item.put("title", title);
        item.put("price", amountTiyin);
        item.put("count", 1);
        item.put("code", ikpu);
        item.put("package_code", packageCode);
        item.put("vat_percent", vat);

        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("receipt_type", 0);
        detail.put("items", List.of(item));
        return detail;
    }
}
