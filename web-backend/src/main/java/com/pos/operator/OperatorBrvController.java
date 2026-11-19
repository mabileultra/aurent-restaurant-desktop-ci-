package com.pos.operator;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * БРВ оператора для касс (порог наличной оплаты AUR-13).
 */
@RestController
@RequestMapping("/operator")
@RequiredArgsConstructor
@Tag(name = "Operator BRV", description = "Базовая расчётная величина и порог наличной оплаты")
public class OperatorBrvController {

    private final OperatorBrvService operatorBrvService;

    @GetMapping("/brv")
    @Operation(summary = "Актуальная БРВ и порог наличной оплаты (25 млн сум по правилу БРВ×units)")
    public ResponseEntity<OperatorBrvResponse> brv() {
        return ResponseEntity.ok(operatorBrvService.current());
    }
}
