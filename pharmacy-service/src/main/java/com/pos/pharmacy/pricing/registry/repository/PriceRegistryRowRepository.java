package com.pos.pharmacy.pricing.registry.repository;

import com.pos.pharmacy.pricing.registry.entity.PriceRegistryRow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PriceRegistryRowRepository extends JpaRepository<PriceRegistryRow, UUID> {

    List<PriceRegistryRow> findBySnapshotId(UUID snapshotId);

    Optional<PriceRegistryRow> findFirstBySnapshotIdAndBarcode(UUID snapshotId, String barcode);

    List<PriceRegistryRow> findBySnapshotIdAndPharmId(UUID snapshotId, String pharmId);

    List<PriceRegistryRow> findBySnapshotIdAndBarcodeIn(UUID snapshotId, Collection<String> barcodes);
}
