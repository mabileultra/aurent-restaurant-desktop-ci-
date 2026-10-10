package com.pos.service.impl;

import com.pos.dto.geo.GeoDistrictResponse;
import com.pos.dto.geo.GeoRegionResponse;
import com.pos.exception.PosExceptions;
import com.pos.repository.GeoDistrictRepository;
import com.pos.repository.GeoRegionRepository;
import com.pos.service.GeoCatalogService;
import com.pos.util.TextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GeoCatalogServiceImpl implements GeoCatalogService {

    private final GeoRegionRepository geoRegionRepository;
    private final GeoDistrictRepository geoDistrictRepository;

    @Override
    public List<GeoRegionResponse> listRegions() {
        return geoRegionRepository.findByActiveTrueOrderBySortOrderAscCodeAsc().stream()
            .map(r -> new GeoRegionResponse(r.getCode(), r.getNameRu(), r.getNameUz()))
            .toList();
    }

    @Override
    public List<GeoDistrictResponse> listDistricts(String regionCode) {
        String code = TextUtil.trimOrNull(regionCode);
        if (code == null) {
            throw PosExceptions.badRequest("Region code is required");
        }
        if (!geoRegionRepository.existsByCodeAndActiveTrue(code)) {
            throw PosExceptions.badRequest("Unknown region code: " + code);
        }
        return geoDistrictRepository.findByRegion_CodeAndActiveTrueOrderBySortOrderAscCodeAsc(code).stream()
            .map(d -> new GeoDistrictResponse(
                d.getCode(),
                d.getRegion().getCode(),
                d.getNameRu(),
                d.getNameUz()
            ))
            .toList();
    }
}
