package com.pos.restaurant.print.service;

import com.pos.restaurant.print.dto.AckPrintJobsRequest;
import com.pos.restaurant.print.dto.ClaimPrintJobsRequest;
import com.pos.restaurant.print.dto.PrintJobResponse;

import java.util.List;

public interface PrintJobService {

    List<PrintJobResponse> pollPending(Integer storeId);

    List<PrintJobResponse> claimPending(Integer storeId, ClaimPrintJobsRequest request);

    void acknowledge(Integer storeId, AckPrintJobsRequest request);

    void release(Integer storeId, AckPrintJobsRequest request);
}
