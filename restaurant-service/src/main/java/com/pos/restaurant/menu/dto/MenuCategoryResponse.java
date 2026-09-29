package com.pos.restaurant.menu.dto;

import java.util.UUID;

public record MenuCategoryResponse(
    UUID id,
    Integer storeId,
    String name,
    int sortOrder,
    boolean active,
    boolean autoPrint,
    String printPrinterName
) {}
