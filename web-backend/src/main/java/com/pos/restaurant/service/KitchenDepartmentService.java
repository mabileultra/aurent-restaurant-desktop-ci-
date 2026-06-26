package com.pos.restaurant.service;

import com.pos.restaurant.dto.KitchenDepartmentResponse;
import com.pos.restaurant.dto.SaveKitchenDepartmentRequest;

import java.util.List;

public interface KitchenDepartmentService {

    List<KitchenDepartmentResponse> list();

    KitchenDepartmentResponse create(SaveKitchenDepartmentRequest request);

    KitchenDepartmentResponse update(Integer entryId, SaveKitchenDepartmentRequest request);

    void delete(Integer entryId);
}
