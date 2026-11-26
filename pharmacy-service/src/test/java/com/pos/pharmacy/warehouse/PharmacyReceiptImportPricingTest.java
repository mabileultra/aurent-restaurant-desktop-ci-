package com.pos.pharmacy.warehouse;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pos.pharmacy.catalog.registry.support.DrugRegistryCardFill;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.importing.spreadsheet.parser.UzInvoicePdfParser;
import com.pos.pharmacy.importing.spreadsheet.parser.UzInvoiceSpreadsheetParser;
import com.pos.pharmacy.warehouse.controller.PharmacyReceiptImportController;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.repository.StockReceiptRepository;
import com.pos.pharmacy.warehouse.service.impl.PharmacyReceiptImportServiceImpl;
import com.pos.pharmacy.warehouse.support.PharmacyImportCatalogHints;
import com.pos.pharmacy.warehouse.support.PharmacyImportCatalogMatcher;
import com.pos.pharmacy.warehouse.support.PharmacyImportGridSupport;
import com.pos.pharmacy.warehouse.support.PharmacyImportMatchSupport;
import com.pos.pharmacy.warehouse.support.PharmacyImportRowMapper;
import com.pos.pharmacy.warehouse.support.PharmacyImportTasnifEnricher;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PharmacyReceiptImportPricingTest {

    private static final String IMPORT = "/pharmacy/receipts/{id}/import";
    private static final String DIDOX_XLS = """
        <html><body><table>
          <tr>
            <th>№</th><th>Маҳсулот номи (хизматлар)</th><th>Маркировка коди</th>
            <th>Товар (хизмат) лар Ягона электрон миллий каталоги бўйича идентификация коди ва номи</th>
            <th>Товар/хизмат штрих коди</th><th>Дори воситаларини бериш усули</th>
            <th>Серия</th><th>Ўлчов бирлиги</th><th>Сотиб олиш қиймати (базавий нарҳ)</th>
            <th>Савдо қўшимчаси (устама), %</th><th>Миқдор</th><th>Нарҳ</th>
            <th>Етказиб бериш қиймати</th><th>ҚҚС Ставка</th><th>Сумма</th>
            <th>Етказиб беришнинг ҚҚСни ҳисобга олган ҳолда қиймати</th><th>Товарни келиб чиқиши</th>
          </tr>
          <tr>
            <td>1</td><td>Тестовый товар А</td><td></td><td>03304001003000000</td>
            <td>4780063974468</td><td>Рецептсиз</td><td>012026</td><td>dona</td>
            <td>2 250,00</td><td>560</td><td>40,000000</td><td>14 850,00</td>
            <td>594 000,00</td><td>12%</td><td>71 280,00</td><td>665 280,00</td><td>Олди-сотди</td>
          </tr>
          <tr>
            <td>2</td><td>Тестовый товар Б</td><td></td><td>03304001003000000</td>
            <td>4780063974468</td><td>Рецептсиз</td><td>022026</td><td>dona</td>
            <td>16 758,94</td><td>-55,25</td><td>10,000000</td><td>7 500,00</td>
            <td>75 000,00</td><td>12%</td><td>9 000,00</td><td>84 000,00</td><td>Олди-сотди</td>
          </tr>
          <tr>
            <td>3</td><td>Тестовый товар В</td><td></td><td>03304001003000000</td>
            <td>4780063974468</td><td>Рецептсиз</td><td>032026</td><td>dona</td>
            <td>44 557,58</td><td>-54,17</td><td>2,000000</td><td>20 422,89</td>
            <td>40 845,77</td><td>12%</td><td>4 901,49</td><td>45 747,26</td><td>Олди-сотди</td>
          </tr>
        </table></body></html>
        """;

    private final UUID receiptId = UUID.randomUUID();
    private final ObjectMapper json = new ObjectMapper().enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        var tenant = mock(TenantSupport.class);
        when(tenant.requireCompanyId()).thenReturn(1);
        var receipt = mock(StockReceipt.class);
        when(receipt.getCompanyId()).thenReturn(1);
        var receipts = mock(StockReceiptRepository.class);
        when(receipts.findDetailedById(receiptId)).thenReturn(Optional.of(receipt));

        var spreadsheet = new UzInvoiceSpreadsheetParser();
        var grid = new PharmacyImportGridSupport(new UzInvoicePdfParser(spreadsheet), spreadsheet);
        var tasnif = mock(PharmacyImportTasnifEnricher.class);
        when(tasnif.apply(any(), anyBoolean(), any()))
            .thenReturn(new PharmacyImportCatalogHints(false, null, null, null));
        var registry = mock(DrugRegistryCardFill.class);
        when(registry.blanks(any(), any(), any(), any()))
            .thenReturn(new DrugRegistryCardFill.Official(null, null, null));
        var mapper = new PharmacyImportRowMapper(tasnif, mock(PharmacyImportCatalogMatcher.class), registry);
        var service = new PharmacyReceiptImportServiceImpl(
            receipts, tenant, mock(PharmacyReceiptSupport.class), grid, mock(PharmacyImportMatchSupport.class),
            null, null, mapper, Runnable::run
        );
        mvc = MockMvcBuilders.standaloneSetup(new PharmacyReceiptImportController(service)).build();
    }

    @ParameterizedTest(name = "useFinalSums={0}")
    @ValueSource(booleans = {false, true})
    void importsDidoxUnitPricesWithOrWithoutFinalSums(boolean useFinalSums) throws Exception {
        var file = new MockMultipartFile(
            "file", "didox-invoice.xls", "application/vnd.ms-excel", DIDOX_XLS.getBytes(StandardCharsets.UTF_8)
        );
        var parsed = json.readTree(mvc.perform(multipart(IMPORT + "/parse", receiptId).file(file))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsByteArray());

        var request = json.createObjectNode();
        var roles = request.putObject("roles");
        for (JsonNode column : parsed.required("columns")) {
            String role = column.required("suggestedRole").asText();
            if (!role.equals("SKIP") && !roles.has(role)) {
                roles.set(role, column.required("index"));
            }
        }
        request.set("rows", parsed.required("rows"));
        request.set("uzInvoiceDocumentId", parsed.required("uzInvoiceDocumentId"));

        var items = match(request, useFinalSums);
        assertThat(items.size()).isEqualTo(3);
        var first = items.required(0);
        var second = items.required(1);
        var third = items.required(2);
        assertAll(
            () -> assertThat(first.required("quantity").decimalValue()).isEqualByComparingTo("40"),
            () -> assertThat(first.required("purchasePrice").decimalValue()).isEqualByComparingTo("2250.00"),
            () -> assertThat(first.required("retailPrice").decimalValue()).isEqualByComparingTo("16632.00"),
            () -> assertThat(second.required("quantity").decimalValue()).isEqualByComparingTo("10"),
            () -> assertThat(second.required("purchasePrice").decimalValue()).isEqualByComparingTo("16758.94"),
            () -> assertThat(second.required("retailPrice").decimalValue()).isEqualByComparingTo("8400.00"),
            () -> assertThat(third.required("quantity").decimalValue()).isEqualByComparingTo("2"),
            () -> assertThat(third.required("purchasePrice").decimalValue()).isEqualByComparingTo("44557.58"),
            () -> assertThat(third.required("retailPrice").decimalValue()).isEqualByComparingTo(useFinalSums ? "22873.63" : "22873.64")
        );
    }

    @ParameterizedTest(name = "qty={0}, retail={2}, useFinalSums={3}")
    @CsvSource({
        "3,   100.01, 150.02, true,  33.34, 50.01",
        "3,   100.01, '',     true,  33.34, 41.67",
        "2.5, 100.01, 210.03, true,  40.00, 84.01",
        "0.2, 10.01,  '',     true,  50.05, 62.56",
        "2,   100.01, 40.00,  true,  50.01, 20.00",
        "0,   100.01, 150.02, true,  100.01, 150.02",
        "3,   100.01, 150.02, false, 100.01, 150.02"
    })
    void normalizesGenericLineTotalsToMoneyPerUnit(
        String quantity, String purchase, String retail, boolean useFinalSums,
        String expectedPurchase, String expectedRetail
    ) throws Exception {
        var request = json.createObjectNode();
        request.putObject("roles")
            .put("NAME", 0).put("QTY", 1).put("PURCHASE", 2).put("RETAIL", 3).put("MARKUP", 4).put("VAT_RATE", 5);
        request.putArray("rows").addArray()
            .add("Тестовый товар").add(quantity).add(purchase).add(retail).add("25").add("0");

        var item = match(request, useFinalSums).required(0);
        assertAll(
            () -> assertThat(item.required("quantity").decimalValue()).isEqualByComparingTo(quantity),
            () -> assertThat(item.required("purchasePrice").decimalValue()).isEqualByComparingTo(expectedPurchase),
            () -> assertThat(item.required("retailPrice").decimalValue()).isEqualByComparingTo(expectedRetail)
        );
    }

    @Test
    void calculatesUnitPurchaseFromTotalWithVatWithoutIntermediateRounding() throws Exception {
        var request = json.createObjectNode();
        request.putObject("roles").put("NAME", 0).put("QTY", 1).put("PURCHASE_WITH_VAT", 2).put("VAT_RATE", 3);
        request.putArray("rows").addArray().add("Тестовый товар").add("0.2").add("10.01").add("12");

        var item = match(request, true).required(0);
        assertAll(
            () -> assertThat(item.required("purchasePrice").decimalValue()).isEqualByComparingTo("44.69"),
            () -> assertThat(item.required("retailPrice").decimalValue()).isEqualByComparingTo("60.06")
        );
    }

    private JsonNode match(ObjectNode request, boolean useFinalSums) throws Exception {
        request.put("useFinalSums", useFinalSums);
        var response = mvc.perform(post(IMPORT + "/match", receiptId)
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(request)))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsByteArray();
        return json.readTree(response).required("items");
    }
}
