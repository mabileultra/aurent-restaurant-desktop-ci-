package com.pos.sales.service.sale.payment;

import com.pos.sales.dto.sale.CreateSaleRequest;
import com.pos.sales.entity.Sale;
import com.pos.sales.service.sale.support.SalePaymentResolver.PaymentAmounts;

import java.math.BigDecimal;
import java.util.Set;

/**
 * Стратегия расчёта сумм по конкретному способу оплаты.
 * Новый способ оплаты — это новая реализация, без правок существующих.
 */
public interface SalePaymentStrategy {

    Set<Sale.PaymentMethod> supports();

    PaymentAmounts resolve(BigDecimal total, CreateSaleRequest request);
}
