package com.pos.service.support;

import com.pos.exception.PosExceptions;
import com.pos.repository.GeoDistrictRepository;
import com.pos.repository.GeoRegionRepository;
import com.pos.util.TextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GeoLocationSupport {

    private final GeoRegionRepository geoRegionRepository;
    private final GeoDistrictRepository geoDistrictRepository;

    public String requireRegionCode(String regionCode) {
        String code = TextUtil.trimOrNull(regionCode);
        if (code == null) {
            throw PosExceptions.badRequest("Region is required");
        }
        if (!geoRegionRepository.existsByCodeAndActiveTrue(code)) {
            throw PosExceptions.badRequest("Unknown region code: " + code);
        }
        return code;
    }

    public String requireDistrictCode(String regionCode, String districtCode) {
        String code = TextUtil.trimOrNull(districtCode);
        if (code == null) {
            throw PosExceptions.badRequest("District is required");
        }
        if (!geoDistrictRepository.existsByCodeAndRegion_CodeAndActiveTrue(code, regionCode)) {
            throw PosExceptions.badRequest("District does not belong to the selected region");
        }
        return code;
    }

    public record GeoCodes(String regionCode, String districtCode) {}

    /**
     * Update semantics for legacy rows without geo:
     * - both blank/null → keep current (may stay null)
     * - either filled → both must be valid and match
     */
    public GeoCodes resolveForUpdate(String currentRegion, String currentDistrict, String regionCode, String districtCode) {
        String nextRegion = TextUtil.trimOrNull(regionCode);
        String nextDistrict = TextUtil.trimOrNull(districtCode);
        if (nextRegion == null && nextDistrict == null) {
            return new GeoCodes(currentRegion, currentDistrict);
        }
        if (nextRegion == null) {
            nextRegion = currentRegion;
        }
        if (nextDistrict == null) {
            nextDistrict = currentDistrict;
        }
        nextRegion = requireRegionCode(nextRegion);
        nextDistrict = requireDistrictCode(nextRegion, nextDistrict);
        return new GeoCodes(nextRegion, nextDistrict);
    }
}
