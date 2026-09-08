package com.pos.platform.controller;

import com.pos.platform.service.BillingPaymentService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/public/billing")
@RequiredArgsConstructor
@Hidden
public class PublicBillingPaymentController {

    private final BillingPaymentService paymentService;

    @PostMapping(value = "/click/prepare", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public Map<String, Object> clickPrepare(@RequestParam MultiValueMap<String, String> form) {
        return paymentService.clickPrepare(flatten(form));
    }

    @PostMapping(value = "/click/complete", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public Map<String, Object> clickComplete(@RequestParam MultiValueMap<String, String> form) {
        return paymentService.clickComplete(flatten(form));
    }

    @PostMapping(value = "/click/prepare", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> clickPrepareJson(@RequestBody Map<String, String> body) {
        return paymentService.clickPrepare(body);
    }

    @PostMapping(value = "/click/complete", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> clickCompleteJson(@RequestBody Map<String, String> body) {
        return paymentService.clickComplete(body);
    }

    @PostMapping("/payme")
    public Object payme(
        @RequestBody Map<String, Object> body,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return paymentService.paymeHandle(body, authorization);
    }

    private static Map<String, String> flatten(MultiValueMap<String, String> form) {
        Map<String, String> map = new HashMap<>();
        form.forEach((k, v) -> map.put(k, v != null && !v.isEmpty() ? v.get(0) : null));
        return map;
    }
}
