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

    @Test
    void readsOpenApiPublicCodesArray() {
        String body = """
            [{
              "code":"0103077972920015217hzSaZihzGFVy",
              "packageType":"UNIT",
              "status":"INTRODUCED",
              "gtin":"03077972920015",
              "productSeries":"123",
              "issuerShortInfo":{"issuerTin":"307797292","issuerName":{"ru":"OOO ROMASHKA"}}
            }]
            """;

        var parsed = parser.parse("0103077972920015217hzSaZihzGFVy", body);

        assertTrue(parsed.found());
        assertEquals("03077972920015", parsed.gtin());
        assertEquals("INTRODUCED", parsed.status());
        assertEquals("123", parsed.batch());
        assertEquals("307797292", parsed.ownerInn());
        assertFalse(parsed.alreadySold());
    }

    @Test
    void readsOpenApiPrivateCodesNested() {
        String body = """
            {
              "results":[{
                "codeData":{"code":"0103077972920015217hzSaZihzGFVy","status":"WITHDRAWN"},
                "productData":{"gtin":"03077972920015","productSeries":"A1","expirationDate":"2026-12-01T00:00:00Z"},
                "turnoverData":{"ownerInfo":{"ownerTin":"307797292"}},
                "markingData":{"issuerInfo":{"issuerTin":"307797292"}}
              }]
            }
            """;

        var parsed = parser.parse("0103077972920015217hzSaZihzGFVy", body);

        assertTrue(parsed.found());
        assertEquals("03077972920015", parsed.gtin());
        assertEquals("WITHDRAWN", parsed.status());
        assertEquals("A1", parsed.batch());
        assertEquals("307797292", parsed.ownerInn());
        assertTrue(parsed.alreadySold());
    }

    @Test
    void firstWithdrawFlagMarksAsSold() {
        String body = """
            [{
              "code":"KM1",
              "status":"INTRODUCED",
              "gtin":"03077972920015",
              "firstWithdrawCodeStateUnchanged":true
            }]
            """;

        var parsed = parser.parse("KM1", body);
        assertTrue(parsed.found());
        assertTrue(parsed.alreadySold());
    }

    @Test
    void parsesDocPrivateUnitExample() {
        String body = """
            {
              "results":[{
                "codeData":{"code":"010307797292003921U=HqEW=YAVhNqy/Uasgl","status":"INTRODUCED","template":"GS1_AISTR_ASYM_SHORT"},
                "packageData":{"packageType":"UNIT","actuallyPacked":0},
                "markingData":{"issuerInfo":{"issuerTin":"307797292"}},
                "productData":{"productId":"132332a2-e5c9-4f11-897b-d4ad94bc5240","gtin":"03077972920039","productGroupId":18},
                "turnoverData":{"originalReleaseMethod":"IMPORT","ownerInfo":{"ownerTin":"307966715"}}
              }],
              "forbiddenCodes":["00189011350000000028"]
            }
            """;

        var parsed = parser.parse("010307797292003921U=HqEW=YAVhNqy/Uasgl", body);
        assertTrue(parsed.found());
        assertEquals("03077972920039", parsed.gtin());
        assertEquals("INTRODUCED", parsed.status());
        assertEquals("307966715", parsed.ownerInn());
        assertFalse(parsed.alreadySold());
    }
}
