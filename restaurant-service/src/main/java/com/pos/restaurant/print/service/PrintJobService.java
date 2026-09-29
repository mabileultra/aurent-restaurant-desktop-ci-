package com.pos.restaurant.print.service;

import com.pos.restaurant.print.dto.AckPrintJobsRequest;
import com.pos.restaurant.print.dto.PrintJobResponse;

import java.util.List;

public interface PrintJobService {

    List<PrintJobResponse> pollPending(Integer storeId);

    void acknowledge(Integer storeId, AckPrintJobsRequest request);
}
