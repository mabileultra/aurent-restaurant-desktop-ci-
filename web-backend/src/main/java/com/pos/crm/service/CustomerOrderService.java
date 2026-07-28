package com.pos.crm.service;

import com.pos.crm.dto.order.CreateCustomerOrderRequest;
import com.pos.crm.dto.order.CustomerOrderCreatedResponse;
import com.pos.crm.dto.order.CustomerOrderDetailResponse;
import com.pos.crm.dto.order.CustomerOrderRowResponse;
import com.pos.crm.dto.order.CourierOptionResponse;
import com.pos.crm.dto.order.PhotoDownload;
import com.pos.crm.dto.order.UpdateCustomerOrderRequest;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CustomerOrderService {

    PageResponse<CustomerOrderRowResponse> list(
        Integer storeId,
        String search,
        String externalNumber,
        String clientName,
        String address,
        UUID courierId,
        String status,
        LocalDate createdFrom,
        LocalDate createdTo,
        Pageable pageable
    );

    List<CourierOptionResponse> listCourierCandidates();

    CustomerOrderDetailResponse getById(long orderId);

    CustomerOrderCreatedResponse createOrder(CreateCustomerOrderRequest req, UUID creatorId);

    CustomerOrderDetailResponse updateOrder(long orderId, UpdateCustomerOrderRequest req);

    void cancelOrder(long orderId);

    CustomerOrderCreatedResponse createWithPhotos(int storeId, List<MultipartFile> photos, UUID creatorId);

    PhotoDownload loadPhoto(long orderId, int slot);
}
