package com.pos.pharmacy.sales.payment;

import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import com.pos.pharmacy.sales.support.SalePaymentResolver.PaymentAmounts;

import java.math.BigDecimal;
import java.util.Set;

public interface SalePaymentStrategy {

    Set<SaleEnums.PaymentMethod> supports();

    PaymentAmounts resolve(BigDecimal total, CreateSaleRequest request);
}
