package com.pos.integrations.pharmacy.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AslMarkingStoreSupportTest {

  @Test
  void allowsRetailAndPharmacy() {
    assertTrue(AslMarkingStoreSupport.supportsAslMarking("GROCERY"));
    assertTrue(AslMarkingStoreSupport.supportsAslMarking("universal"));
    assertTrue(AslMarkingStoreSupport.supportsAslMarking("CONSTRUCTION"));
    assertTrue(AslMarkingStoreSupport.supportsAslMarking("PHARMACY"));
  }

  @Test
  void rejectsRestaurant() {
    assertFalse(AslMarkingStoreSupport.supportsAslMarking("RESTAURANT"));
    assertFalse(AslMarkingStoreSupport.supportsAslMarking(null));
  }

  @Test
  void pharmacyOnlyForDmed() {
    assertTrue(AslMarkingStoreSupport.isPharmacy("pharmacy"));
    assertFalse(AslMarkingStoreSupport.isPharmacy("GROCERY"));
  }
}
