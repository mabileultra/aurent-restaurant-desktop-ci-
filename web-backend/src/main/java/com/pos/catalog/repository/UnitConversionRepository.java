package com.pos.catalog.repository;

import com.pos.catalog.entity.UnitConversion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UnitConversionRepository extends JpaRepository<UnitConversion, UnitConversion.UnitConversionId> {

    List<UnitConversion> findAllByOrderByFromCodeAscToCodeAsc();
}
