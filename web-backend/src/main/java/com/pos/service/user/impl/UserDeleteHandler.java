package com.pos.service.user.impl;

import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.repository.CashierShiftRepository;
import com.pos.repository.CustomerOrderRepository;
import com.pos.repository.SaleRepository;
import com.pos.repository.UserRepository;
import com.pos.security.cache.AuthenticatedUserCache;
import com.pos.service.user.support.UserAccessPolicy;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserDeleteHandler {

    private final UserRepository userRepository;
    private final UserAccessPolicy accessPolicy;
    private final SaleRepository saleRepository;
    private final CashierShiftRepository cashierShiftRepository;
    private final CustomerOrderRepository customerOrderRepository;
    private final AuthenticatedUserCache authenticatedUserCache;

    @Transactional(rollbackFor = Exception.class)
    public void delete(UUID id) {
        User user = accessPolicy.requireAccessible(id);
        accessPolicy.assertDeletable(user);
        assertNoBlockingReferences(user.getId());
        authenticatedUserCache.evict(user.getId());
        userRepository.delete(user);
        LogUtil.info(UserDeleteHandler.class, "User deleted: id={}, username={}", id, user.getUsername());
    }

    private void assertNoBlockingReferences(UUID userId) {
        if (saleRepository.existsByCashier_Id(userId)) {
            throw PosExceptions.badRequest("User has sales history and cannot be deleted");
        }
        if (cashierShiftRepository.existsByCashier_Id(userId)) {
            throw PosExceptions.badRequest("User has cashier shifts and cannot be deleted");
        }
        if (customerOrderRepository.existsByCreatedBy_Id(userId)) {
            throw PosExceptions.badRequest("User has created orders and cannot be deleted");
        }
    }
}
