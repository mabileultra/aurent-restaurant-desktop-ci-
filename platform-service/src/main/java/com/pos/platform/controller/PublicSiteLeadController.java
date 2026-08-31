package com.pos.platform.controller;

import com.pos.platform.dto.site.CreateSiteLeadRequest;
import com.pos.platform.dto.site.SiteLeadResponse;
import com.pos.platform.service.SiteLeadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/site/leads")
@RequiredArgsConstructor
@Tag(name = "Public Site Leads", description = "Заявки с публичного сайта")
public class PublicSiteLeadController {

    private final SiteLeadService siteLeadService;

    @PostMapping
    @Operation(summary = "Отправить заявку")
    public ResponseEntity<SiteLeadResponse> create(@Valid @RequestBody CreateSiteLeadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(siteLeadService.createPublic(request));
    }
}
