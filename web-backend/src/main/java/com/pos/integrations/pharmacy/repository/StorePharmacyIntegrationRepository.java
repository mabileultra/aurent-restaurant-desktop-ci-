package com.pos.integrations.pharmacy.repository;

import com.pos.integrations.pharmacy.entity.StorePharmacyIntegration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StorePharmacyIntegrationRepository extends JpaRepository<StorePharmacyIntegration, Integer> {
}
