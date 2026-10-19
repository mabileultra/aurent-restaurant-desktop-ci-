package com.pos.restaurant.edge.dto;

/** Shape aligned with cloud StoreResponse so restaurant FE can reuse storeApi.getAll(). */
public record EdgeStoreResponse(
    Integer id,
    String name,
    String code,
    String address,
    String regionCode,
    String districtCode,
    String phone,
    Integer companyId,
    String companyName,
    Integer businessTypeId,
    String businessType,
    boolean active
) {}
