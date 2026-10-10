package com.pos.service;

import com.pos.dto.geo.GeoDistrictResponse;
import com.pos.dto.geo.GeoRegionResponse;

import java.util.List;

public interface GeoCatalogService {

    List<GeoRegionResponse> listRegions();

    List<GeoDistrictResponse> listDistricts(String regionCode);
}
