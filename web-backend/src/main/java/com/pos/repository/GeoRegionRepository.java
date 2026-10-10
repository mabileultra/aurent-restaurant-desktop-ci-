package com.pos.repository;

import com.pos.entity.GeoRegion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GeoRegionRepository extends JpaRepository<GeoRegion, String> {

    List<GeoRegion> findByActiveTrueOrderBySortOrderAscCodeAsc();

    boolean existsByCodeAndActiveTrue(String code);
}
