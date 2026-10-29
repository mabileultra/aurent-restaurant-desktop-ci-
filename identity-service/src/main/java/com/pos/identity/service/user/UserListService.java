package com.pos.identity.service.user;

import com.pos.identity.dto.user.ManagedUserPage;
import com.pos.identity.dto.user.UserListCriteria;
import org.springframework.data.domain.Pageable;

public interface UserListService {

    ManagedUserPage list(UserListCriteria criteria, Pageable pageable);
}
