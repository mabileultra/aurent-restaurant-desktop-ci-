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
        if (siblings.size() <= 1) {
            return;
        }
        List<MenuItem> dirty = new ArrayList<>();
        for (MenuItem sibling : siblings) {
            if (sibling.getId().equals(source.getId())) {
                continue;
            }
            if (sameFiscal(sibling, source)) {
                continue;
            }
            fiscalApplier.copyFrom(sibling, source);
            dirty.add(sibling);
        }
        if (dirty.isEmpty()) {
            return;
        }
        itemRepository.saveAll(dirty);
        LogUtil.info(
            MenuVariantFiscalSync.class,
            "Synced fiscal to variant siblings: groupId={}, sourceId={}, updated={}",
            groupId,
            source.getId(),
            dirty.size()
        );
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
