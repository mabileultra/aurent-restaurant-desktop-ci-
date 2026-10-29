package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.entity.EdgeStockCategory;
import com.pos.restaurant.edge.repository.EdgeStockCategoryRepository;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.security.RestaurantTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeStockCategoryService {

    private final EdgeStockCategoryRepository repository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(Integer businessTypeId) {
        Integer companyId = requireCompany();
        List<EdgeStockCategory> rows = businessTypeId == null
            ? repository.findByCompanyIdOrderByNameAsc(companyId)
            : repository.findByCompanyIdAndBusinessTypeIdOrderByNameAsc(companyId, businessTypeId);
        return rows.stream().map(this::toDto).toList();
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> body) {
        Integer companyId = requireCompany();
        String name = str(body.get("name"));
        if (!StringUtils.hasText(name)) throw new BusinessException("name required");
        int nextId = repository.findFirstByCompanyIdOrderByIdDesc(companyId)
            .map(c -> c.getId() + 1)
            .orElse(1);
        // Keep cloud ids when bootstrapping.
        Integer id = intVal(body.get("id"));
        if (id == null) id = nextId;
        EdgeStockCategory row = EdgeStockCategory.builder()
            .id(id)
            .companyId(companyId)
            .name(name.trim())
            .description(str(body.get("description")))
            .businessTypeId(intVal(body.get("businessTypeId")))
            .businessTypeCode(str(body.get("businessTypeCode")))
            .businessTypeName(str(body.get("businessTypeName")))
            .build();
        repository.save(row);
        return toDto(row);
    }

    @Transactional
    public Map<String, Object> update(Integer id, Map<String, Object> body) {
        Integer companyId = requireCompany();
        EdgeStockCategory row = repository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new NotFoundException("Category not found"));
        if (body.containsKey("name")) {
            String name = str(body.get("name"));
            if (!StringUtils.hasText(name)) throw new BusinessException("name required");
            row.setName(name.trim());
        }
        if (body.containsKey("description")) row.setDescription(str(body.get("description")));
        if (body.containsKey("businessTypeId")) row.setBusinessTypeId(intVal(body.get("businessTypeId")));
        if (body.containsKey("businessTypeCode")) row.setBusinessTypeCode(str(body.get("businessTypeCode")));
        if (body.containsKey("businessTypeName")) row.setBusinessTypeName(str(body.get("businessTypeName")));
        repository.save(row);
        return toDto(row);
    }

    @Transactional
    public void delete(Integer id) {
        Integer companyId = requireCompany();
        EdgeStockCategory row = repository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new NotFoundException("Category not found"));
        repository.delete(row);
    }

    @Transactional
    public int bootstrapReplace(Integer companyId, List<Map<String, Object>> rows) {
        if (companyId == null || rows == null) return 0;
        int n = 0;
        for (Map<String, Object> body : rows) {
            Integer id = intVal(body.get("id"));
            String name = str(body.get("name"));
            if (id == null || !StringUtils.hasText(name)) continue;
            EdgeStockCategory row = repository.findById(id).orElseGet(EdgeStockCategory::new);
            row.setId(id);
            row.setCompanyId(companyId);
            row.setName(name.trim());
            row.setDescription(str(body.get("description")));
            row.setBusinessTypeId(intVal(body.get("businessTypeId")));
            row.setBusinessTypeCode(str(body.get("businessTypeCode")));
            row.setBusinessTypeName(str(body.get("businessTypeName")));
            repository.save(row);
            n++;
        }
        return n;
    }

    private Map<String, Object> toDto(EdgeStockCategory c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("description", c.getDescription());
        m.put("businessTypeId", c.getBusinessTypeId());
        m.put("businessTypeCode", c.getBusinessTypeCode());
        m.put("businessTypeName", c.getBusinessTypeName());
        return m;
    }

    private Integer requireCompany() {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        if (companyId == null) throw new BusinessException("company required");
        return companyId;
    }

    private static String str(Object v) {
        return v == null ? null : String.valueOf(v).trim();
    }

    private static Integer intVal(Object v) {
        if (v instanceof Number n) return n.intValue();
        if (v == null) return null;
        try {
            return Integer.parseInt(String.valueOf(v).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
