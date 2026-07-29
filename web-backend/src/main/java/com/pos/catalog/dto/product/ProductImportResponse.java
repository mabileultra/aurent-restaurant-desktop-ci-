package com.pos.catalog.dto.product;

import java.util.List;

public record ProductImportResponse(int created, int skipped, List<String> errors) {}
