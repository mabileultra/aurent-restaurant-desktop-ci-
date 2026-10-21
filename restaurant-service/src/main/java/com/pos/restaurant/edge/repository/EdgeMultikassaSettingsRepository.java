package com.pos.restaurant.edge.repository;

import com.pos.restaurant.edge.entity.EdgeMultikassaSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EdgeMultikassaSettingsRepository extends JpaRepository<EdgeMultikassaSettings, Integer> {

    Optional<EdgeMultikassaSettings> findByCashRegisterId(Long cashRegisterId);
}
