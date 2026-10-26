package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.entity.EdgeMultikassaSettings;
import com.pos.restaurant.edge.repository.EdgeMultikassaSettingsRepository;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.security.RestaurantTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/** Local Multikassa/fiscal capabilities for restaurant-desktop offline. */
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeMultikassaController {

    private final EdgeMultikassaSettingsRepository repository;

    @GetMapping("/cashier/multikassa")
    public ResponseEntity<Map<String, Object>> cashierCapabilities(
        @RequestParam Integer storeId,
        @RequestParam(required = false) Long cashRegisterId
    ) {
        return ResponseEntity.ok(toCaps(load(storeId), cashRegisterId));
    }

    @PatchMapping("/cashier/multikassa/flags")
    public ResponseEntity<Map<String, Object>> updateFlags(
        @RequestParam Integer storeId,
        @RequestParam(required = false) Long cashRegisterId,
        @RequestBody Map<String, Object> body
    ) {
        EdgeMultikassaSettings row = ensure(storeId);
        if (body.containsKey("enabled")) {
            row.setEnabled(Boolean.TRUE.equals(body.get("enabled")));
        }
        if (body.containsKey("requireBeforeSale")) {
            row.setRequireBeforeSale(Boolean.TRUE.equals(body.get("requireBeforeSale")));
        }
        if (body.containsKey("printFiscalQr")) {
            row.setPrintFiscalQr(Boolean.TRUE.equals(body.get("printFiscalQr")));
        }
        row.setUpdatedAt(Instant.now());
        repository.save(row);
        return ResponseEntity.ok(toCaps(row, cashRegisterId));
    }

    @GetMapping("/admin/cash-registers/{cashRegisterId}/multikassa")
    public ResponseEntity<Map<String, Object>> adminGet(
        @PathVariable Long cashRegisterId,
        @RequestParam(required = false) Integer storeId
    ) {
        EdgeMultikassaSettings row = storeId != null
            ? load(storeId)
            : repository.findByCashRegisterId(cashRegisterId).orElse(null);
        Map<String, Object> m = toCaps(row, cashRegisterId);
        m.put("cashRegisterId", cashRegisterId);
        if (row != null) m.put("storeId", row.getStoreId());
        return ResponseEntity.ok(m);
    }

    @PutMapping("/admin/cash-registers/{cashRegisterId}/multikassa")
    public ResponseEntity<Map<String, Object>> adminSave(
        @PathVariable Long cashRegisterId,
        @RequestParam(required = false) Integer storeId,
        @RequestBody Map<String, Object> body
    ) {
        Integer sid = storeId != null ? storeId
            : (body.get("storeId") instanceof Number n ? n.intValue() : null);
        if (sid == null) {
            sid = repository.findByCashRegisterId(cashRegisterId).map(EdgeMultikassaSettings::getStoreId).orElse(null);
        }
        if (sid == null) throw new BusinessException("storeId required");
        EdgeMultikassaSettings row = ensure(sid);
        row.setCashRegisterId(cashRegisterId);
        if (body.containsKey("enabled")) row.setEnabled(Boolean.TRUE.equals(body.get("enabled")));
        if (body.containsKey("baseUrl")) row.setBaseUrl(str(body.get("baseUrl")));
        if (body.containsKey("terminalId")) row.setTerminalId(str(body.get("terminalId")));
        if (body.containsKey("moduleNumber")) row.setModuleNumber(str(body.get("moduleNumber")));
        if (body.containsKey("selectedDriveId")) row.setSelectedDriveId(str(body.get("selectedDriveId")));
        if (body.containsKey("cashierNameOverride")) row.setCashierNameOverride(str(body.get("cashierNameOverride")));
        if (body.containsKey("requireBeforeSale")) {
            row.setRequireBeforeSale(Boolean.TRUE.equals(body.get("requireBeforeSale")));
        }
        if (body.containsKey("printFiscalQr")) {
            row.setPrintFiscalQr(!Boolean.FALSE.equals(body.get("printFiscalQr")));
        }
        if (body.containsKey("fiscalProvider")) row.setFiscalProvider(str(body.get("fiscalProvider")));
        if (body.containsKey("factoryId")) row.setFactoryId(str(body.get("factoryId")));
        row.setUpdatedAt(Instant.now());
        repository.save(row);
        return ResponseEntity.ok(toCaps(row, cashRegisterId));
    }

    private EdgeMultikassaSettings load(Integer storeId) {
        return repository.findById(storeId).orElse(null);
    }

    private EdgeMultikassaSettings ensure(Integer storeId) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        if (companyId == null) throw new BusinessException("Company context required");
        return repository.findById(storeId).orElseGet(() -> {
            EdgeMultikassaSettings row = new EdgeMultikassaSettings();
            row.setStoreId(storeId);
            row.setCompanyId(companyId);
            row.setUpdatedAt(Instant.now());
            return row;
        });
    }

    private static Map<String, Object> toCaps(EdgeMultikassaSettings row, Long cashRegisterId) {
        Map<String, Object> m = new HashMap<>();
        boolean enabled = row != null && row.isEnabled();
        m.put("enabled", enabled);
        m.put("cashRegisterId", cashRegisterId != null ? cashRegisterId
            : (row == null ? null : row.getCashRegisterId()));
        m.put("baseUrl", row == null ? null : row.getBaseUrl());
        m.put("terminalId", row == null ? null : row.getTerminalId());
        m.put("moduleNumber", row == null ? null : row.getModuleNumber());
        m.put("selectedDriveId", row == null ? null : row.getSelectedDriveId());
        m.put("cashierNameOverride", row == null ? null : row.getCashierNameOverride());
        m.put("requireBeforeSale", row != null && row.isRequireBeforeSale());
        m.put("printFiscalQr", row == null || row.isPrintFiscalQr());
        m.put("fiscalProvider", row == null || row.getFiscalProvider() == null ? "MULTIKASSA" : row.getFiscalProvider());
        m.put("factoryId", row == null ? null : row.getFactoryId());
        return m;
    }

    private static String str(Object v) {
        return v == null ? null : String.valueOf(v);
    }
}
