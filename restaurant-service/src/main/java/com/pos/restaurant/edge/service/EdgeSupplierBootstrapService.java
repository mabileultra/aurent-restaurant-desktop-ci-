package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.entity.EdgeSupplier;
import com.pos.restaurant.edge.repository.EdgeSupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** One-shot import of cloud suppliers into edge_suppliers. */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeSupplierBootstrapService {

    private final EdgeSupplierRepository repository;

    @Transactional
    public int bootstrapReplace(Integer companyId, List<Map<String, Object>> rows) {
        if (companyId == null || rows == null) return 0;
        int n = 0;
        for (Map<String, Object> body : rows) {
            UUID id = uuid(body.get("id"));
            String name = str(body.get("name"));
            if (id == null || !StringUtils.hasText(name)) continue;
            String taxId = firstNonBlank(str(body.get("taxId")), str(body.get("inn")));
            EdgeSupplier row = repository.findById(id).orElseGet(EdgeSupplier::new);
            row.setId(id);
            row.setCompanyId(companyId);
            row.setName(name.trim());
            row.setInn(taxId);
            row.setAddress(str(body.get("address")));
            row.setPhone(str(body.get("phone")));
            if (body.containsKey("active") && body.get("active") != null) {
                row.setActive(Boolean.parseBoolean(String.valueOf(body.get("active"))));
            } else if (row.getCreatedAt() == null) {
                row.setActive(true);
            }
            if (row.getCreatedAt() == null) {
                Instant created = parseInstant(body.get("createdAt"));
                row.setCreatedAt(created != null ? created : Instant.now());
            }
            repository.save(row);
            n++;
        }
        return n;
    }

    private static UUID uuid(Object v) {
        if (v instanceof UUID u) return u;
        if (v == null) return null;
        try {
            return UUID.fromString(String.valueOf(v).trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String str(Object v) {
        if (v == null) return null;
        String s = String.valueOf(v).trim();
        return s.isEmpty() || "null".equalsIgnoreCase(s) ? null : s;
    }

    private static String firstNonBlank(String a, String b) {
        if (StringUtils.hasText(a)) return a;
        if (StringUtils.hasText(b)) return b;
        return null;
    }

    private static Instant parseInstant(Object v) {
        if (v instanceof Instant i) return i;
        if (v == null) return null;
        try {
            return Instant.parse(String.valueOf(v).trim());
        } catch (Exception e) {
            return null;
        }
    }
}
