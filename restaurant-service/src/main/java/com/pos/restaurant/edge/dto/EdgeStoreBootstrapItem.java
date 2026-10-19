package com.pos.restaurant.edge.dto;

public record EdgeStoreBootstrapItem(
    Integer id,
    String name,
    String code,
    String address,
    String businessType,
    Boolean active
) {}
