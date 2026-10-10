package com.pos.repository;

import com.pos.entity.GeoDistrict;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GeoDistrictRepository extends JpaRepository<GeoDistrict, String> {

    List<GeoDistrict> findByRegion_CodeAndActiveTrueOrderBySortOrderAscCodeAsc(String regionCode);

    Optional<GeoDistrict> findByCodeAndActiveTrue(String code);

    boolean existsByCodeAndRegion_CodeAndActiveTrue(String code, String regionCode);
}
