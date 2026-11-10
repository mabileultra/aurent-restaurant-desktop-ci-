package com.pos.integrations.platform.controller;

import com.pos.dto.email.EmailTemplateInfoResponse;
import com.pos.dto.email.EmailTemplatePreviewRequest;
import com.pos.dto.email.EmailTemplatePreviewResponse;
import com.pos.dto.email.SendBroadcastEmailRequest;
import com.pos.dto.email.SendBroadcastEmailResponse;
import com.pos.dto.email.SendTestEmailRequest;
import com.pos.service.email.PlatformEmailService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/internal/platform/ops/email")
@RequiredArgsConstructor
@Hidden
public class PlatformEmailInternalController {

    private final PlatformEmailService platformEmailService;

    @GetMapping("/templates")
    public ResponseEntity<List<EmailTemplateInfoResponse>> templates() {
        return ResponseEntity.ok(platformEmailService.listTemplates());
    }

    @PostMapping("/templates/preview")
    public ResponseEntity<EmailTemplatePreviewResponse> preview(
        @Valid @RequestBody EmailTemplatePreviewRequest request
    ) {
        return ResponseEntity.ok(platformEmailService.preview(request));
    }

    @PostMapping("/broadcast")
    public ResponseEntity<SendBroadcastEmailResponse> broadcast(
        @Valid @RequestBody SendBroadcastEmailRequest request
    ) {
        return ResponseEntity.ok(platformEmailService.sendBroadcast(request));
    }

    @PostMapping("/test")
    public ResponseEntity<SendBroadcastEmailResponse> test(
        @Valid @RequestBody SendTestEmailRequest request
    ) {
        return ResponseEntity.ok(platformEmailService.sendTest(request));
    }
}
