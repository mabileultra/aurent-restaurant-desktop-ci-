package com.pos.integrations.markingvalidation.client;

import com.pos.integrations.markingvalidation.config.MarkingValidationProperties;
import com.pos.integrations.markingvalidation.dto.MarkingValidationResponse;
import com.pos.integrations.markingvalidation.dto.MarkingValidationResponse.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class TasnifOnkmValidationClientTest {

    private static final String URL = "https://tasnif.test/api/cl-api/marking/validation-onkm";

    private MockRestServiceServer server;
    private TasnifOnkmValidationClient client;
    private MarkingValidationProperties properties;

    @BeforeEach
    void setUp() {
        properties = new MarkingValidationProperties();
        properties.setUrl(URL);
        properties.setUsername("user");
        properties.setPassword("secret");
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new TasnifOnkmValidationClient(builder.build(), properties);
    }

    private static OnkmValidationRequest request() {
        return new OnkmValidationRequest("200523221", "ZZ000000000000", 0, List.of(
            new OnkmValidationRequest.Product(
                null, "02208005001025008", "1077302", BigDecimal.ONE,
                List.of("010509987308971221uC*NTOg"), List.of("010509987308971221uC*NTOg\u001d934444")
            )
        ));
    }

    @Test
    void successIsValid() {
        server.expect(requestTo(URL))
            .andExpect(method(HttpMethod.POST))
            .andExpect(jsonPath("$.terminalId").value("ZZ000000000000"))
            .andExpect(jsonPath("$.products[0].kmIds[0]").value("010509987308971221uC*NTOg"))
            .andRespond(withSuccess("{\"success\":true,\"code\":null}", MediaType.APPLICATION_JSON));

        assertThat(client.validate(request()).status()).isEqualTo(Status.VALID);
        server.verify();
    }

    @Test
    void rejectionKeepsCodeAndMessages() {
        server.expect(requestTo(URL)).andRespond(withSuccess(
            "{\"success\":false,\"messageRu\":\"Код содержит недопустимые символы\","
                + "\"messageLat\":\"Markirovka ko'dida noto'g'ri belgilar mavjud\",\"code\":\"**2010**\"}",
            MediaType.APPLICATION_JSON
        ));

        MarkingValidationResponse res = client.validate(request());
        assertThat(res.status()).isEqualTo(Status.REJECTED);
        assertThat(res.code()).isEqualTo("2010");
        assertThat(res.message()).isEqualTo("Код содержит недопустимые символы");
    }

    @Test
    void rejectionOnHttp400BodyIsStillParsed() {
        server.expect(requestTo(URL)).andRespond(withStatus(HttpStatus.BAD_REQUEST)
            .contentType(MediaType.APPLICATION_JSON)
            .body("{\"success\":false,\"messageRu\":\"Код поддельный\",\"code\":\"2030\"}"));

        assertThat(client.validate(request()).code()).isEqualTo("2030");
    }

    @Test
    void unauthorizedIsUnavailable() {
        server.expect(requestTo(URL)).andRespond(withStatus(HttpStatus.UNAUTHORIZED)
            .contentType(MediaType.APPLICATION_JSON)
            .body("{\"success\":false,\"message\":\"Invalid username or password\"}"));

        MarkingValidationResponse res = client.validate(request());
        assertThat(res.status()).isEqualTo(Status.UNAVAILABLE);
        assertThat(res.code()).isEqualTo("HTTP_401");
    }

    @Test
    void serverErrorIsUnavailable() {
        server.expect(requestTo(URL)).andRespond(withServerError());

        MarkingValidationResponse res = client.validate(request());
        assertThat(res.status()).isEqualTo(Status.UNAVAILABLE);
        assertThat(res.code()).isEqualTo("HTTP_500");
    }

    @Test
    void missingCredentialsIsUnavailableWithoutCall() {
        properties.setPassword("");

        MarkingValidationResponse res = client.validate(request());
        assertThat(res.status()).isEqualTo(Status.UNAVAILABLE);
        assertThat(res.code()).isEqualTo("NOT_CONFIGURED");
        server.verify();
    }
}
