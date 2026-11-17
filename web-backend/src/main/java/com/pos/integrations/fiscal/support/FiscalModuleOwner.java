package com.pos.integrations.fiscal.support;

/**
 * Касса, за которой уже закреплён идентификатор ФМ (проекция JPQL, AUR-19).
 */
public record FiscalModuleOwner(
    Long registerId,
    Integer registerNumber,
    Integer storeId,
    String storeName,
    Integer companyId,
    String status
) {
}
