package com.pos.identity.controller.internal;

import com.pos.identity.client.dto.UserSyncRequest;
import com.pos.identity.entity.User;
import com.pos.identity.exception.IdentityExceptions;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.support.UserSyncSupport;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/internal/pos")
@RequiredArgsConstructor
@Hidden
public class PosInternalController {

    private final UserRepository userRepository;
    private final UserSyncSupport userSyncSupport;

    @GetMapping("/users/{id}/sync-payload")
    public ResponseEntity<UserSyncRequest> syncPayload(@PathVariable UUID id) {
        User user = userRepository.findByIdWithDetails(id)
            .orElseThrow(() -> IdentityExceptions.notFound("User", id));
        return ResponseEntity.ok(userSyncSupport.toSyncRequest(user, "UPDATE"));
    }
}
