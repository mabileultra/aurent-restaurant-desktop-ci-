package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyMarkErrors;
import com.pos.pharmacy.sales.dto.SaleItemRequest;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
public class CheckoutMarkGuard {

    public record MarkPlan(List<String> allMarks, List<List<String>> marksPerItem) {}

    public MarkPlan collect(List<SaleItemRequest> items) {
        List<String> allMarks = new ArrayList<>();
        List<List<String>> marksPerItem = new ArrayList<>();
        for (SaleItemRequest itemReq : items) {
            List<String> marks = normalizeMarks(itemReq.productMarks());
            marksPerItem.add(marks);
            allMarks.addAll(marks);
        }
        assertNoDuplicateMarksInRequest(allMarks);
        return new MarkPlan(allMarks, marksPerItem);
    }

    static List<String> normalizeMarks(List<String> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        LinkedHashSet<String> unique = new LinkedHashSet<>();
        for (String mark : raw) {
            if (mark == null) {
                continue;
            }
            String trimmed = mark.trim();
            if (!trimmed.isEmpty()) {
                unique.add(trimmed);
            }
        }
        return List.copyOf(unique);
    }

    static void assertNoDuplicateMarksInRequest(List<String> markCodes) {
        Set<String> seen = new HashSet<>();
        for (String code : markCodes) {
            for (String key : PharmacyMarkIdentityKeys.keysOf(code)) {
                if (!seen.add(key)) {
                    throw PharmacyErrors.of(PharmacyMarkErrors.PHARM_MARK_DUPLICATE_IN_SALE);
                }
            }
        }
    }
}
