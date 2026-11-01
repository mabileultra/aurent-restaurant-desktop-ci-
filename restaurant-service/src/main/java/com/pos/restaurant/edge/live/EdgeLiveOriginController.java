package com.pos.restaurant.edge.live;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.revision.FloorRevisionStore;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Tiny local watermark for Electron — poll often without full live-export.
 */
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeLiveOriginController {

    private final FloorRevisionStore floorRevisionStore;

    @Value("${app.restaurant.edge.bootstrap-secret:edge-dev-bootstrap}")
    private String bootstrapSecret;

    @GetMapping("/edge/live-origin")
    public ResponseEntity<Map<String, Object>> origin(
        @RequestParam Integer storeId,
        @RequestParam Integer companyId,
        @RequestParam(required = false) String bootstrapSecret
    ) {
        assertSecret(bootstrapSecret);
        if (storeId == null || companyId == null) {
            throw new BusinessException("storeId and companyId required");
        }
        return ResponseEntity.ok(Map.of(
            "companyId", companyId,
            "storeId", storeId,
            "origin", floorRevisionStore.readOrigin(companyId, storeId),
            "revision", floorRevisionStore.readRevision(companyId, storeId)
        ));
    }

    private void assertSecret(String given) {
        if (StringUtils.hasText(this.bootstrapSecret)
            && !this.bootstrapSecret.equals(String.valueOf(given))) {
            throw new BusinessException("Invalid bootstrap secret");
        }
    }
}
