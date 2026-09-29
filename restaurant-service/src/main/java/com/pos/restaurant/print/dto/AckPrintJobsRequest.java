package com.pos.restaurant.print.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record AckPrintJobsRequest(
    @NotEmpty List<UUID> jobIds
) {}
