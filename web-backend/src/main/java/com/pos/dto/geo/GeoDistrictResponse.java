package com.pos.dto.geo;

public record GeoDistrictResponse(
    String code,
    String regionCode,
    String nameRu,
    String nameUz
) {}
