package com.pos.restaurant.edge.support;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.edge.entity.EdgeStaff;
import com.pos.restaurant.edge.repository.EdgeStaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Export local edge_staff hashes for cloud ingest (S2b). */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeStaffLocalExporter {

    private final EdgeStaffRepository staffRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Map<String, Object> exportForCompany(Integer companyId) {
        List<EdgeStaff> rows = companyId == null
            ? staffRepository.findAll()
            : staffRepository.findByCompanyIdOrderByFullNameAsc(companyId);
        List<Map<String, Object>> staff = new ArrayList<>();
        Integer resolvedCompanyId = companyId;
        String loginCode = null;
        for (EdgeStaff row : rows) {
            if (resolvedCompanyId == null) {
                resolvedCompanyId = row.getCompanyId();
            }
            if (!StringUtils.hasText(loginCode) && StringUtils.hasText(row.getCompanyLoginCode())) {
                loginCode = row.getCompanyLoginCode();
            }
            if (!row.isActive() && !StringUtils.hasText(row.getPinHash()) && !StringUtils.hasText(row.getPasswordHash())) {
                continue;
            }
            Map<String, Object> item = new HashMap<>();
            item.put("userId", row.getUserId());
            item.put("username", row.getUsername());
            item.put("email", row.getEmail());
            item.put("fullName", row.getFullName());
            item.put("role", row.getRole());
            item.put("passwordHash", row.getPasswordHash());
            item.put("pinHash", row.getPinHash());
            item.put("storeIds", readIntList(row.getStoreIdsJson()));
            item.put("active", row.isActive());
            item.put("updatedAt", row.getUpdatedAt());
            staff.add(item);
        }
        Map<String, Object> out = new HashMap<>();
        out.put("companyId", resolvedCompanyId);
        out.put("companyLoginCode", loginCode);
        out.put("staff", staff);
        return out;
    }

    private List<Integer> readIntList(String json) {
        if (!StringUtils.hasText(json)) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }
}
