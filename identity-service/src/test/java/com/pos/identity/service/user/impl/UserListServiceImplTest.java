package com.pos.identity.service.user.impl;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.dto.user.UserListCriteria;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.service.user.support.ManagedUserAssembler;
import com.pos.identity.service.user.support.UserListScope;
import com.pos.identity.service.user.support.UserListScopeResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserListServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserListScopeResolver scopeResolver;
    @Mock
    private PosCoreClient posCoreClient;

    private UserListServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UserListServiceImpl(
            userRepository,
            scopeResolver,
            new ManagedUserAssembler(),
            posCoreClient
        );
    }

    @Test
    void emptyCompanyScopeSkipsUserQuery() {
        when(scopeResolver.resolve(any())).thenReturn(new UserListScope(
            List.of(), List.of(), List.of(), null, true
        ));

        var page = service.list(new UserListCriteria(null, null, null, "PHARMACY", null, null, null, null), PageRequest.of(2, 14));

        assertEquals(0, page.totalElements());
        assertEquals(2, page.number());
        verify(userRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void unrestrictedScopeQueriesOnePage() {
        when(scopeResolver.resolve(any())).thenReturn(new UserListScope(
            null, List.of(), List.of(), null, true
        ));
        when(userRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenAnswer(invocation -> new PageImpl<>(List.of(), invocation.getArgument(1), 0));

        var page = service.list(new UserListCriteria("ann", null, null, null, null, null, null, null), PageRequest.of(0, 500));

        assertEquals(0, page.totalElements());
        assertEquals(100, page.size());
        verify(posCoreClient, never()).findCompaniesByIds(any());
    }
}
