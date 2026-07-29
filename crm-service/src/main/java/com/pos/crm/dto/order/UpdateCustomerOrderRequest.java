package com.pos.crm.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateCustomerOrderRequest(
    @NotBlank @Size(max = 255) String clientName,
    @NotBlank @Size(max = 40) String clientPhone,
    @NotBlank String deliveryAddress,
    @Size(max = 4000) String comment,
    UUID courierId
) {}
