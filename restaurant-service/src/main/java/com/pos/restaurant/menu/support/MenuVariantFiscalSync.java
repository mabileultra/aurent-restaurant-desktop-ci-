package com.pos.restaurant.menu.support;

import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Fiscal (Tasnif) fields are shared across size variants of one dish.
 * New variants already copy on create; this keeps siblings in sync on update
 * and backfills rows that were saved without ИКПУ.
 * Never propagates a blank ИКПУ over siblings that already have one.
 */
@Component
@RequiredArgsConstructor
public class MenuVariantFiscalSync {

    private final MenuItemRepository itemRepository;
    private final MenuItemFiscalApplier fiscalApplier;

    public void syncGroupFrom(MenuItem source) {
        if (source == null || source.getVariantGroupId() == null || source.getCompanyId() == null) {
            return;
        }
        UUID groupId = source.getVariantGroupId();
        List<MenuItem> siblings = itemRepository.findByCompanyIdAndVariantGroupId(
            source.getCompanyId(),
            groupId
        );
        if (siblings.isEmpty()) {
            return;
        }
        MenuItem donor = resolveDonor(source, siblings);
        if (donor == null) {
            return;
        }
        List<MenuItem> dirty = new ArrayList<>();
        for (MenuItem member : siblings) {
            if (sameFiscal(member, donor)) {
                continue;
            }
            fiscalApplier.copyFrom(member, donor);
            dirty.add(member);
        }
        if (!siblings.stream().anyMatch(m -> m.getId().equals(source.getId()))
            && !sameFiscal(source, donor)) {
            fiscalApplier.copyFrom(source, donor);
            dirty.add(source);
        }
        if (dirty.isEmpty()) {
            return;
        }
        itemRepository.saveAll(dirty);
        LogUtil.info(
            MenuVariantFiscalSync.class,
            "Synced fiscal to variant siblings: groupId={}, donorId={}, updated={}",
            groupId,
            donor.getId(),
            dirty.size()
        );
    }

    /**
     * Prefer the trigger row when it has ИКПУ; otherwise any sibling that still has it
     * (repairs sizes wiped by a partial update that omitted fiscal fields).
     */
    private static MenuItem resolveDonor(MenuItem source, List<MenuItem> siblings) {
        if (hasIkpu(source)) {
            return source;
        }
        for (MenuItem sibling : siblings) {
            if (hasIkpu(sibling)) {
                return sibling;
            }
        }
        return null;
    }

    private static boolean hasIkpu(MenuItem item) {
        return item != null && item.getIkpu() != null && !item.getIkpu().isBlank();
    }

    private static boolean sameFiscal(MenuItem a, MenuItem b) {
        return eq(a.getIkpu(), b.getIkpu())
            && eq(a.getPackageCode(), b.getPackageCode())
            && eq(a.getUnitOfMeasure(), b.getUnitOfMeasure())
            && eq(a.getUnitMeasureCode(), b.getUnitMeasureCode())
            && eq(a.getBarcode(), b.getBarcode())
            && a.isMarkedProduct() == b.isMarkedProduct();
    }

    private static boolean eq(String left, String right) {
        String a = left == null || left.isBlank() ? null : left.trim();
        String b = right == null || right.isBlank() ? null : right.trim();
        if (a == null && b == null) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        return a.equals(b);
    }
}
