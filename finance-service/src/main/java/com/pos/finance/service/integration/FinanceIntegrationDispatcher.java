package com.pos.finance.service.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.finance.dto.integration.AdvanceSaleDepositRequest;
import com.pos.finance.dto.integration.CreditPurchasePayableRequest;
import com.pos.finance.dto.integration.CreditSaleReceivableRequest;
import com.pos.finance.dto.integration.PurchaseExpenseRequest;
import com.pos.finance.dto.integration.RefundExpenseRequest;
import com.pos.finance.dto.integration.SaleAdvanceApplyRequest;
import com.pos.finance.dto.integration.SaleIncomeRequest;
import com.pos.finance.dto.integration.ZReportIncomeRequest;
import com.pos.finance.exception.FinanceException;
import com.pos.finance.service.AdvanceSaleIntegrationService;
import com.pos.finance.service.CreditPurchaseIntegrationService;
import com.pos.finance.service.CreditSaleIntegrationService;
import com.pos.finance.service.CustomerAdvanceService;
import com.pos.finance.service.PurchaseIntegrationService;
import com.pos.finance.service.ReturnIntegrationService;
import com.pos.finance.service.SaleIntegrationService;
import com.pos.finance.service.ZReportIntegrationService;
import com.pos.finance.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FinanceIntegrationDispatcher {

    private final ObjectMapper objectMapper;
    private final SaleIntegrationService saleIntegrationService;
    private final PurchaseIntegrationService purchaseIntegrationService;
    private final ReturnIntegrationService returnIntegrationService;
    private final CreditSaleIntegrationService creditSaleIntegrationService;
    private final CreditPurchaseIntegrationService creditPurchaseIntegrationService;
    private final AdvanceSaleIntegrationService advanceSaleIntegrationService;
    private final CustomerAdvanceService customerAdvanceService;
    private final ZReportIntegrationService zReportIntegrationService;

    public void dispatch(String targetPath, Object payload) {
        try {
            dispatch(targetPath, objectMapper.writeValueAsString(payload));
        } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
            throw new FinanceException(HttpStatus.BAD_REQUEST, "Integration payload serialization failed");
        }
    }

    public void dispatch(String targetPath, String payloadJson) {
        try {
            switch (targetPath) {
                case "/internal/finance/incomes/from-sale" ->
                    saleIntegrationService.recordSaleIncome(read(payloadJson, SaleIncomeRequest.class));
                case "/internal/finance/incomes/from-z-report" ->
                    zReportIntegrationService.recordZReportIncome(read(payloadJson, ZReportIncomeRequest.class));
                case "/internal/finance/expenses/from-purchase" ->
                    purchaseIntegrationService.recordPurchaseExpense(read(payloadJson, PurchaseExpenseRequest.class));
                case "/internal/finance/expenses/from-refund" ->
                    returnIntegrationService.recordRefundExpense(read(payloadJson, RefundExpenseRequest.class));
                case "/internal/finance/receivables/from-credit-sale" ->
                    creditSaleIntegrationService.recordCreditSale(read(payloadJson, CreditSaleReceivableRequest.class));
                case "/internal/finance/payables/from-credit-purchase" ->
                    creditPurchaseIntegrationService.recordCreditPurchase(read(payloadJson, CreditPurchasePayableRequest.class));
                case "/internal/finance/advances/from-advance-sale" ->
                    advanceSaleIntegrationService.recordAdvanceDeposit(read(payloadJson, AdvanceSaleDepositRequest.class));
                case "/internal/finance/advances/from-sale-payment" ->
                    customerAdvanceService.applyAdvanceFromSale(read(payloadJson, SaleAdvanceApplyRequest.class));
                default -> throw new FinanceException(HttpStatus.BAD_REQUEST, "Unknown finance integration path: " + targetPath);
            }
        } catch (FinanceException ex) {
            throw ex;
        } catch (Exception ex) {
            LogUtil.warn(
                FinanceIntegrationDispatcher.class,
                "Finance integration dispatch failed: path={}, error={}",
                targetPath,
                ex.getMessage()
            );
            throw new FinanceException(HttpStatus.BAD_REQUEST, "Invalid integration payload for " + targetPath);
        }
    }

    private <T> T read(String payloadJson, Class<T> type) throws com.fasterxml.jackson.core.JsonProcessingException {
        return objectMapper.readValue(payloadJson, type);
    }
}
