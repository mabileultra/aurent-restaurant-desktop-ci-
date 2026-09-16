package com.pos.pharmacy.sales.domain;

public final class SaleEnums {

    private SaleEnums() {}

    public enum PaymentMethod { CASH, CARD, CASHLESS, MPESA, MIXED }

    public enum SaleStatus { COMPLETED, REFUNDED, VOIDED }

    public enum ReceiptType { SALE, ADVANCE, CREDIT }

    public enum CardType { HUMO, UZCARD, PAYME, CLICK, PERSONAL, CORPORATE, SOCIAL }
}
