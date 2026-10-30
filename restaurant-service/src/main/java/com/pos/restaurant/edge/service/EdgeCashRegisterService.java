package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.entity.EdgeCashRegister;
import com.pos.restaurant.edge.repository.EdgeCashRegisterRepository;
import com.pos.restaurant.edge.repository.EdgeStoreRepository;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.security.RestaurantTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCashRegisterService {

    private final EdgeCashRegisterRepository repository;
    private final EdgeStoreRepository storeRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> list(Integer storeId, int page, int size) {
        Integer companyId = requireCompany();
        PageRequest pr = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200));
        Page<EdgeCashRegister> result = storeId == null
            ? repository.findByCompanyId(companyId, pr)
            : repository.findByCompanyIdAndStoreId(companyId, storeId, pr);
        List<Map<String, Object>> content = result.getContent().stream().map(this::toDto).toList();
        Map<String, Object> body = new HashMap<>();
        body.put("content", content);
        body.put("totalElements", result.getTotalElements());
        body.put("totalPages", result.getTotalPages());
        body.put("size", result.getSize());
        body.put("number", result.getNumber());
        return body;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> get(Long id) {
        Integer companyId = requireCompany();
        EdgeCashRegister row = repository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new NotFoundException("Cash register not found"));
        return toDto(row);
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> body) {
        Integer companyId = requireCompany();
        Integer storeId = intVal(body.get("storeId"));
        if (storeId == null) throw new BusinessException("storeId required");
        Long id = longVal(body.get("id"));
        if (id == null) {
            id = repository.findFirstByCompanyIdOrderByIdDesc(companyId)
                .map(r -> r.getId() + 1)
                .orElse(1L);
        }
        EdgeCashRegister row = EdgeCashRegister.builder()
            .id(id)
            .companyId(companyId)
            .storeId(storeId)
            .registerNumber(intVal(body.get("registerNumber")))
            .equipmentModel(str(body.get("equipmentModel")))
            .equipmentSerial(str(body.get("equipmentSerial")))
            .fiscalCardId(str(body.get("fiscalCardId")))
            .deviceId(str(body.get("deviceId")))
            .workstationName(str(body.get("workstationName")))
            .status(StringUtils.hasText(str(body.get("status"))) ? str(body.get("status")) : "ACTIVE")
            .build();
        repository.save(row);
        return toDto(row);
    }

    @Transactional
    public int bootstrapReplace(Integer companyId, List<Map<String, Object>> rows) {
        if (companyId == null || rows == null) return 0;
        int n = 0;
        for (Map<String, Object> body : rows) {
            Long id = longVal(body.get("id"));
            Integer storeId = intVal(body.get("storeId"));
            if (id == null || storeId == null) continue;
            EdgeCashRegister row = repository.findById(id).orElseGet(EdgeCashRegister::new);
            row.setId(id);
            row.setCompanyId(companyId);
            row.setStoreId(storeId);
            row.setRegisterNumber(intVal(body.get("registerNumber")));
            row.setEquipmentModel(str(body.get("equipmentModel")));
            row.setEquipmentSerial(str(body.get("equipmentSerial")));
            row.setFiscalCardId(str(body.get("fiscalCardId")));
            row.setDeviceId(str(body.get("deviceId")));
            row.setWorkstationName(str(body.get("workstationName")));
            String status = str(body.get("status"));
            row.setStatus(StringUtils.hasText(status) ? status : "ACTIVE");
            repository.save(row);
            n++;
        }
        return n;
    }

    private Map<String, Object> toDto(EdgeCashRegister r) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", r.getId());
        m.put("storeId", r.getStoreId());
        m.put("storeName", storeRepository.findById(r.getStoreId()).map(s -> s.getName()).orElse(null));
        m.put("registerNumber", r.getRegisterNumber());
        m.put("equipmentModel", r.getEquipmentModel());
        m.put("equipmentSerial", r.getEquipmentSerial());
        m.put("fiscalCardId", r.getFiscalCardId());
        m.put("deviceId", r.getDeviceId());
        m.put("workstationName", r.getWorkstationName());
        m.put("status", r.getStatus());
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

    private static Long longVal(Object v) {
        if (v instanceof Number n) return n.longValue();
        if (v == null) return null;
        try {
            return Long.parseLong(String.valueOf(v).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
