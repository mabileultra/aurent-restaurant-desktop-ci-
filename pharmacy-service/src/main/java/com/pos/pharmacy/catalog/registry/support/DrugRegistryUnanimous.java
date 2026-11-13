package com.pos.pharmacy.catalog.registry.support;

import com.pos.pharmacy.catalog.registry.entity.DrugRegistryEntry;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

/** Одна карточка, если все строки с этим названием совпали по стране, производителю и рецепту. */
public final class DrugRegistryUnanimous {

    private DrugRegistryUnanimous() {
    }

    public static Optional<DrugRegistryEntry> one(List<DrugRegistryEntry> rows) {
        if (rows == null || rows.isEmpty()) {
            return Optional.empty();
        }
        DrugRegistryEntry first = rows.get(0);
        for (int i = 1; i < rows.size(); i++) {
            DrugRegistryEntry row = rows.get(i);
            if (!same(first.getManufacturer(), row.getManufacturer())
                || !same(first.getCountry(), row.getCountry())
                || !Objects.equals(first.getPrescriptionRequired(), row.getPrescriptionRequired())) {
                return Optional.empty();
            }
        }
        return Optional.of(first);
    }

    private static boolean same(String left, String right) {
        return DrugRegistryNameKey.of(left).equals(DrugRegistryNameKey.of(right));
    }
}
