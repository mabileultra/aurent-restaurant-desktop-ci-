package com.pos.platform.service;

import com.pos.platform.dto.geo.GeoDistrictResponse;
import com.pos.platform.dto.geo.GeoRegionResponse;

import java.util.List;

public interface GeoCatalogService {

    List<GeoRegionResponse> listRegions();

    List<GeoDistrictResponse> listDistricts(String regionCode);
}
