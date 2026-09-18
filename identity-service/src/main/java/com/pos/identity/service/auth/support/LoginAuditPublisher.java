package com.pos.identity.service.auth.support;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.AuditRequest;
import com.pos.identity.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LoginAuditPublisher {

    private final PosCoreClient posCoreClient;

    public void publish(User user, String action, String entityType, String entityId) {
        posCoreClient.audit(new AuditRequest(
            user.getId().toString(),
            action,
            entityType,
            entityId,
            null,
            null
        ));
    }
}
