package com.pos.identity.service.support;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.UserSyncRequest;
import com.pos.identity.entity.User;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class UserSyncSupport {

    private final PosCoreClient posCoreClient;

    public void syncCreate(User user) {
        sync(user, "CREATE");
    }

    public void syncUpdate(User user) {
        sync(user, "UPDATE");
    }

    public void syncToggle(User user) {
        sync(user, "TOGGLE");
    }

    public void syncDelete(User user) {
        sync(user, "DELETE");
    }

    public UserSyncRequest toSyncRequest(User user, String operation) {
        List<Integer> storeIds = user.getStoreIds() == null
            ? List.of()
            : user.getStoreIds().stream().sorted().toList();
        return new UserSyncRequest(
            operation,
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getPassword(),
            user.getPinDigest(),
            user.getFullName(),
            user.getFirstName(),
            user.getLastName(),
            user.getPatronymic(),
            user.getRole() != null ? user.getRole().getName() : null,
            user.getCompanyId(),
            storeIds,
            user.isActive(),
            user.isModuleAccessCustom()
        );
    }

    private void sync(User user, String operation) {
        try {
            posCoreClient.syncUser(toSyncRequest(user, operation));
        } catch (Exception ex) {
            LogUtil.error(UserSyncSupport.class, "User sync to POS core failed: userId=" + user.getId() + ", op=" + operation, ex);
        }
    }
}
