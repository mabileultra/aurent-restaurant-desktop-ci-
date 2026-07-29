package com.pos.crm.dto.order;

import org.springframework.core.io.Resource;

public record PhotoDownload(Resource resource, String contentType) {}
