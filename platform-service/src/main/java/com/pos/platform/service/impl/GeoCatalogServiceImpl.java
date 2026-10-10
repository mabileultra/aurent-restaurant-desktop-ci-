package com.pos.platform.service.impl;

import com.pos.platform.dto.geo.GeoDistrictResponse;
import com.pos.platform.dto.geo.GeoRegionResponse;
import com.pos.platform.exception.BadRequestException;
import com.pos.platform.repository.GeoDistrictRepository;
import com.pos.platform.repository.GeoRegionRepository;
import com.pos.platform.service.GeoCatalogService;
import com.pos.platform.util.TextUtil;
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
            throw new BadRequestException("Region code is required");
        }
        if (!geoRegionRepository.existsByCodeAndActiveTrue(code)) {
            throw new BadRequestException("Unknown region code: " + code);
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
