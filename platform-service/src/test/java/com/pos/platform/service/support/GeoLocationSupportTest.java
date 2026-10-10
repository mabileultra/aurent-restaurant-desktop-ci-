package com.pos.platform.service.support;

import com.pos.platform.exception.BadRequestException;
import com.pos.platform.repository.GeoDistrictRepository;
import com.pos.platform.repository.GeoRegionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GeoLocationSupportTest {

    @Mock
    private GeoRegionRepository geoRegionRepository;
    @Mock
    private GeoDistrictRepository geoDistrictRepository;

    private GeoLocationSupport support;

    @BeforeEach
    void setUp() {
        support = new GeoLocationSupport(geoRegionRepository, geoDistrictRepository);
    }

    @Test
    void requireRegionAndDistrict() {
        when(geoRegionRepository.existsByCodeAndActiveTrue("18")).thenReturn(true);
        when(geoDistrictRepository.existsByCodeAndRegion_CodeAndActiveTrue("1801", "18")).thenReturn(true);

        assertEquals("18", support.requireRegionCode("18"));
        assertEquals("1801", support.requireDistrictCode("18", "1801"));
    }

    @Test
    void rejectsDistrictFromOtherRegion() {
        when(geoDistrictRepository.existsByCodeAndRegion_CodeAndActiveTrue("2601", "18")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> support.requireDistrictCode("18", "2601"));
    }

    @Test
    void updateKeepsNullGeoWhenBlank() {
        var codes = support.resolveForUpdate(null, null, "", "  ");
        assertEquals(null, codes.regionCode());
        assertEquals(null, codes.districtCode());
    }
}
