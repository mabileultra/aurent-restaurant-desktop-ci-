package com.pos.platform.repository;

import com.pos.platform.entity.GeoRegion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GeoRegionRepository extends JpaRepository<GeoRegion, String> {

    List<GeoRegion> findByActiveTrueOrderBySortOrderAscCodeAsc();

    boolean existsByCodeAndActiveTrue(String code);
}
