package com.pos.identity.service;

import com.pos.identity.dto.user.CreateUserRequest;
import com.pos.identity.dto.user.UpdateUserRequest;
import com.pos.identity.dto.user.UserResponse;

import java.util.List;
import java.util.UUID;

public interface UserService {

    List<UserResponse> findAll();

    /** POS roster: active users assigned to a store (waiters/cashiers for assign + labels). */
    List<UserResponse> findPosRoster(Integer storeId);

    UserResponse findById(UUID id);

    UserResponse create(CreateUserRequest request);

    UserResponse update(UUID id, UpdateUserRequest request);

    UserResponse toggleActive(UUID id);

    void delete(UUID id);
}
