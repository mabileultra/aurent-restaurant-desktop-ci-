package com.pos.identity.service.auth;

import com.pos.identity.dto.auth.EdgeStaffIngestRequest;
import com.pos.identity.dto.auth.EdgeStaffIngestResponse;

public interface EdgeStaffIngestService {

    /** Soft upsert hall staff into identity (no deactivate of cloud-only users). */
    EdgeStaffIngestResponse ingest(EdgeStaffIngestRequest request);
}
