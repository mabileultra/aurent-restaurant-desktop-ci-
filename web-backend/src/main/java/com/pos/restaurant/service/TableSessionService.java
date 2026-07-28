package com.pos.restaurant.service;

import com.pos.restaurant.dto.AddTableSessionLineRequest;
import com.pos.restaurant.dto.AssignWaiterRequest;
import com.pos.restaurant.dto.OpenTableSessionRequest;
import com.pos.restaurant.dto.TableSessionCheckoutPreviewResponse;
import com.pos.restaurant.dto.TableSessionCheckoutRequest;
import com.pos.restaurant.dto.TableSessionResponse;
import com.pos.restaurant.dto.UpdateTableSessionLineRequest;
import com.pos.sales.dto.sale.SaleResponse;

import java.util.UUID;

public interface TableSessionService {

    TableSessionResponse openSession(Integer tableId, OpenTableSessionRequest request);

    TableSessionResponse getSession(UUID sessionId);

    TableSessionResponse addLine(UUID sessionId, AddTableSessionLineRequest request);

    TableSessionResponse updateLine(UUID sessionId, UUID lineId, UpdateTableSessionLineRequest request);

    TableSessionResponse removeLine(UUID sessionId, UUID lineId);

    TableSessionResponse assignWaiter(UUID sessionId, AssignWaiterRequest request);

    TableSessionCheckoutPreviewResponse buildCheckoutPreview(UUID sessionId);

    SaleResponse checkout(UUID sessionId, TableSessionCheckoutRequest request);

    void cancelSession(UUID sessionId);
}
