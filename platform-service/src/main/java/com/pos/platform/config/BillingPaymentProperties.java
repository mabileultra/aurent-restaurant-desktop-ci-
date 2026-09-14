package com.pos.platform.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.billing.payments")
public class BillingPaymentProperties {

    private String returnUrl = "https://aurent.uz/billing";
    private Click click = new Click();
    private Payme payme = new Payme();

    @Getter
    @Setter
    public static class Click {
        private boolean enabled;
        private String merchantId = "";
        private String serviceId = "";
        private String merchantUserId = "";
        private String secretKey = "";
        private String payUrl = "https://my.click.uz/services/pay";
    }

    @Getter
    @Setter
    public static class Payme {
        private boolean enabled;
        private String merchantId = "";
        /** Production KEY from Payme cabinet */
        private String secretKey = "";
        /** Optional TEST KEY — sandbox / песочница (Paycom:TEST_KEY) */
        private String testSecretKey = "";
        /** checkout.paycom.uz (prod) or test.paycom.uz (sandbox) */
        private String checkoutUrl = "https://checkout.paycom.uz";
        /** Fiscal item title in CheckPerformTransaction.detail */
        private String receiptTitle = "Пополнение баланса Aurent";
        /** MXIK / ИКПУ (tasnif.soliq.uz) */
        private String ikpu = "10305008003000000";
        /** Package code linked to IKPU (услуга сум) */
        private String packageCode = "1546532";
        /** VAT percent for fiscal receipt */
        private int vatPercent = 12;
    }
}
