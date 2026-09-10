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
        private String secretKey = "";
        private String checkoutUrl = "https://checkout.paycom.uz";
    }
}
