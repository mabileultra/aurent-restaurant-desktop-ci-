package com.pos.pharmacy.sales.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateSaleRequest(
    @NotEmpty @Valid List<SaleItemRequest> items,
    @NotBlank String paymentMethod,
    @NotNull Integer storeId,
    /** Доля наличными (для MIXED). */
    BigDecimal cashAmount,
    /** Доля картой (для MIXED; можно не передавать — остаток от total). */
    BigDecimal cardAmount,
    BigDecimal amountTendered,
    String notes,
    /** ПИНФЛ пациента (аптека), опционально. */
    String patientPinfl,
    /** Телефон лояльности (аптека), опционально. */
    String loyaltyPhone,
    /** AUR-18: номер электронного рецепта, обязателен при рецептурных товарах. */
    String prescriptionNumber,
    /** Чек через DMED / страхование. */
    Boolean pharmacyDmed,
    UUID customerId,
    String receiptType,
    String cardType,
    /** Скидка на весь чек (сумма), после скидок по строкам. */
    @DecimalMin("0") BigDecimal orderDiscountAmount,
    /** Скидка на чек, % (опционально, для отчётов). */
    @DecimalMin("0") BigDecimal orderDiscountPercent,
    /** Оплата с аванса клиента (для SALE с customerId). */
    @DecimalMin("0") BigDecimal advanceAmount,
    /** Печатать фискальный QR (снимок настройки кассы; null = true). */
    Boolean printFiscalQr,
    /** Результат Multikassa (касса шлёт после POST /api/v1/operations). */
    @Valid SaleFiscalPayload fiscal,
    /*
     * AUR-17: реквизиты со слип-чека терминала, только при оплате картой.
     * Формат проверяет PharmacySaleCardDetailsApplier, а не @Pattern: «rejected value» попал бы в лог.
     */
    /** CORPORATE / PERSONAL / SOCIAL. */
    String cardCategory,
    /** RRN транзакции, 12 цифр (пробелы и дефисы допускаются). */
    String rrn,
    /** Маска номера социальной карты 8600********1234; полный номер — 400. */
    String socialCardNumber
) {}
