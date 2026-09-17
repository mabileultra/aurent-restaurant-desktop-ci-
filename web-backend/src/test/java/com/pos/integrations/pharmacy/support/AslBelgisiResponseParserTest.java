package com.pos.integrations.pharmacy.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AslBelgisiResponseParserTest {

    private final AslBelgisiResponseParser parser = new AslBelgisiResponseParser(new ObjectMapper());

    @Test
    void readsGtinFromResultsArray() throws Exception {
        String body = """
            {"results":[{"code":"010478001234567821SERIAL","status":"INTRODUCED","gtin":"04780012345678","productName":"Nurofen"}]}
            """;

        var parsed = parser.parse("010478001234567821SERIAL", body);

        assertTrue(parsed.found());
        assertEquals("04780012345678", parsed.gtin());
        assertEquals("Nurofen", parsed.productName());
        assertEquals("INTRODUCED", parsed.status());
        assertFalse(parsed.alreadySold());
    }

    @Test
    void readsNestedProductCard() throws Exception {
        String body = """
            {"codes":[{"cis":"KM","product":{"gtin":"04780012345678","name":"Aspirin"}}]}
            """;

        var parsed = parser.parse("KM", body);

        assertTrue(parsed.found());
        assertEquals("04780012345678", parsed.gtin());
        assertEquals("Aspirin", parsed.productName());
    }

    @Test
    void withdrawnCodeIsAlreadySold() {
        String body = """
            {"results":[{"code":"KM","status":"WITHDRAWN","gtin":"04780012345678","productName":"Nurofen"}]}
            """;

        var parsed = parser.parse("KM", body);

        assertTrue(parsed.alreadySold());
    }

    @Test
    void emptyResultsAreNotFound() {
        var parsed = parser.parse("KM", "{\"results\":[]}");
        assertFalse(parsed.found());
    }

    @Test
    void readsUnauthorizedDescription() {
        String body = """
            [{"code":"unauthorized","context":{"description":"Error in authorization"}}]
            """;

        assertEquals("Error in authorization", parser.errorMessage(body));
    }
}
