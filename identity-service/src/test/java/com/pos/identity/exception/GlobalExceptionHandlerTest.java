package com.pos.identity.exception;

import com.pos.shared.api.ApiErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    @Test
    void missingRouteIsNotFound() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        MockHttpServletRequest request = new MockHttpServletRequest(
            "GET", "/api/v1/platform/module-access/role-templates");

        var response = handler.handleNoHandler(
            new NoResourceFoundException(HttpMethod.GET, "platform/module-access/role-templates"),
            request
        );

        ApiErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(404, response.getStatusCode().value());
        assertEquals("NOT_FOUND", body.code());
        assertEquals("Resource not found", body.message());
        assertEquals("/api/v1/platform/module-access/role-templates", body.path());
    }
}
