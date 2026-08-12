package com.pos.support.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.support.dto.SupportContactsResponse;
import com.pos.support.service.SupportContactsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/support-contacts")
@RequiredArgsConstructor
@Tag(name = "Support Contacts", description = "Контакты поддержки CRM/кассы (не аптечный бот)")
@StandardApiResponses
public class SupportContactsController {

    private final SupportContactsService supportContactsService;

    @GetMapping
    @Operation(
        summary = "Контакты поддержки",
        description = "Телефон и Telegram-бот поддержки POS/CRM. Аптечный бот сюда не входит."
    )
    @ApiResponse(responseCode = "200", description = "Контакты")
    public ResponseEntity<SupportContactsResponse> get() {
        return ResponseEntity.ok(supportContactsService.getContacts());
    }
}
