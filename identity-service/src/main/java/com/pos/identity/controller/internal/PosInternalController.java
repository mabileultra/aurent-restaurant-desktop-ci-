package com.pos.identity.controller.internal;

import com.pos.identity.client.dto.UserSyncRequest;
import com.pos.identity.dto.user.PlatformProvisionUserRequest;
import com.pos.identity.dto.user.UserResponse;
import com.pos.identity.entity.User;
import com.pos.identity.exception.IdentityExceptions;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.service.support.UserSyncSupport;
import com.pos.identity.service.user.impl.PlatformUserProvisioner;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
    private final PlatformUserProvisioner platformUserProvisioner;

    @GetMapping("/users/{id}/sync-payload")
    public ResponseEntity<UserSyncRequest> syncPayload(@PathVariable UUID id) {
        User user = userRepository.findByIdWithDetails(id)
            .orElseThrow(() -> IdentityExceptions.notFound("User", id));
        return ResponseEntity.ok(userSyncSupport.toSyncRequest(user, "UPDATE"));
    }

    @PostMapping("/users")
    public ResponseEntity<UserResponse> provisionAdmin(@Valid @RequestBody PlatformProvisionUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(platformUserProvisioner.provisionAdmin(request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteProvisioned(@PathVariable UUID id) {
        platformUserProvisioner.delete(id);
        return ResponseEntity.noContent().build();
    }
}
