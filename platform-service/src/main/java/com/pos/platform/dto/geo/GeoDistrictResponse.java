package com.pos.platform.dto.geo;

public record GeoDistrictResponse(
    String code,
    String regionCode,
    String nameRu,
    String nameUz
) {}
