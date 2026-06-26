package com.pos.finance.controller;

import com.pos.finance.dto.integration.AdvanceSaleDepositRequest;
import com.pos.finance.dto.integration.CreditPurchasePayableRequest;
import com.pos.finance.dto.integration.CreditSaleReceivableRequest;
import com.pos.finance.dto.integration.PurchaseExpenseRequest;
import com.pos.finance.dto.integration.RefundExpenseRequest;
import com.pos.finance.dto.integration.SaleAdvanceApplyRequest;
import com.pos.finance.dto.integration.SaleIncomeRequest;
import com.pos.finance.dto.integration.ZReportIncomeRequest;
import com.pos.finance.service.integration.FinanceIntegrationDispatcher;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/finance")
@RequiredArgsConstructor
@Hidden
public class InternalIntegrationController {

    private final FinanceIntegrationDispatcher dispatcher;

    @PostMapping("/incomes/from-sale")
    public ResponseEntity<Void> recordSaleIncome(@Valid @RequestBody SaleIncomeRequest request) {
        dispatcher.dispatch("/internal/finance/incomes/from-sale", request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/incomes/from-z-report")
    public ResponseEntity<Void> recordZReportIncome(@Valid @RequestBody ZReportIncomeRequest request) {
        dispatcher.dispatch("/internal/finance/incomes/from-z-report", request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/expenses/from-purchase")
    public ResponseEntity<Void> recordPurchaseExpense(@Valid @RequestBody PurchaseExpenseRequest request) {
        dispatcher.dispatch("/internal/finance/expenses/from-purchase", request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/expenses/from-refund")
    public ResponseEntity<Void> recordRefundExpense(@Valid @RequestBody RefundExpenseRequest request) {
        dispatcher.dispatch("/internal/finance/expenses/from-refund", request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/receivables/from-credit-sale")
    public ResponseEntity<Void> recordCreditSale(@Valid @RequestBody CreditSaleReceivableRequest request) {
        dispatcher.dispatch("/internal/finance/receivables/from-credit-sale", request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/payables/from-credit-purchase")
    public ResponseEntity<Void> recordCreditPurchase(@Valid @RequestBody CreditPurchasePayableRequest request) {
        dispatcher.dispatch("/internal/finance/payables/from-credit-purchase", request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/advances/from-advance-sale")
    public ResponseEntity<Void> recordAdvanceSale(@Valid @RequestBody AdvanceSaleDepositRequest request) {
        dispatcher.dispatch("/internal/finance/advances/from-advance-sale", request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/advances/from-sale-payment")
    public ResponseEntity<Void> recordSaleAdvancePayment(@Valid @RequestBody SaleAdvanceApplyRequest request) {
        dispatcher.dispatch("/internal/finance/advances/from-sale-payment", request);
        return ResponseEntity.accepted().build();
    }
}
