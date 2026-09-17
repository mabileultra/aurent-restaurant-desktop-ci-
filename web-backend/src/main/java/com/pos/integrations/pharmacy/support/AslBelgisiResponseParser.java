package com.pos.integrations.pharmacy.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pos.integrations.pharmacy.dto.MarkingVerifyResponse;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * Парсер ответов Open API v1.45:
 * - public/api/cod/public/codes → массив объектов
 * - public/api/cod/private/codes → { results: [{ codeData, productData, ... }], forbiddenCodes }
 */
public final class AslBelgisiResponseParser {

  private static final List<String> COLLECTION_FIELDS = List.of(
    "results", "codes", "result", "items", "data", "content"
  );
  private static final List<String> NESTED_FIELDS = List.of(
    "codeData", "productData", "packageData", "markingData", "turnoverData",
    "product", "productCard", "publicData", "cisInfo", "info", "attributes", "issuerShortInfo"
  );

  private final ObjectMapper objectMapper;

  public AslBelgisiResponseParser(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public MarkingVerifyResponse parse(String requestedCode, String body) {
    if (!StringUtils.hasText(body)) {
      return empty(requestedCode);
    }
    try {
      JsonNode root = objectMapper.readTree(body);
      JsonNode entry = firstEntry(root);
      if (entry == null) {
        return empty(requestedCode);
      }
      String gtin = firstText(entry, "gtin", "productGtin", "gtin14");
      String productName = firstText(entry, "productName", "product_name", "name", "shortName");
      // status из справочника 13.15; extendedStatus — отдельное поле, не подменяет status
      String status = firstText(entry, "status", "codeStatus", "state");
      boolean found = StringUtils.hasText(gtin) || StringUtils.hasText(productName) || StringUtils.hasText(status);
      if (!found) {
        return empty(requestedCode);
      }
      Map<String, Object> details = toFlatMap(entry);
      String owner = nestedText(entry, "ownerInfo", "ownerTin", "ownerInn");
      if (!StringUtils.hasText(owner)) {
        owner = firstText(entry, "ownerTin", "ownerInn", "owner_inn");
      }
      if (!StringUtils.hasText(owner)) {
        owner = nestedText(entry, "issuerShortInfo", "issuerTin", "issuerInn");
      }
      if (!StringUtils.hasText(owner)) {
        owner = nestedText(entry, "issuerInfo", "issuerTin", "issuerInn");
      }
      if (!StringUtils.hasText(owner)) {
        owner = firstText(entry, "issuerTin", "issuerInn");
      }
      return new MarkingVerifyResponse(
        true,
        firstNonBlank(
          firstText(entry, "code", "cis", "km", "markingCode"),
          requestedCode
        ),
        status,
        gtin,
        productName,
        firstText(entry, "expirationDate", "expiration_date", "expDate"),
        firstText(entry, "productSeries", "batch", "batchNumber", "series"),
        owner,
        details,
        AslMarkingCirculation.alreadySold(status, details)
      );
    } catch (Exception ex) {
      return empty(requestedCode);
    }
  }

  public String errorMessage(String body) {
    if (!StringUtils.hasText(body)) {
      return null;
    }
    try {
      JsonNode root = objectMapper.readTree(body);
      String fromNode = errorText(root);
      if (StringUtils.hasText(fromNode)) {
        return fromNode;
      }
    } catch (Exception ignored) {
      return body.length() > 200 ? body.substring(0, 200) : body;
    }
    return null;
  }

  private JsonNode firstEntry(JsonNode root) {
    if (root == null || root.isNull()) {
      return null;
    }
    if (root.isArray()) {
      for (JsonNode item : root) {
        JsonNode entry = firstEntry(item);
        if (entry != null) {
          return entry;
        }
      }
      return null;
    }
    if (!root.isObject()) {
      return null;
    }

    // private/codes: results[].{codeData, productData, ...}
    JsonNode results = root.get("results");
    if (results != null && results.isArray() && !results.isEmpty()) {
      JsonNode merged = mergePrivateResult(results.get(0));
      if (merged != null) {
        return merged;
      }
    }

    for (String field : COLLECTION_FIELDS) {
      if ("results".equals(field)) {
        continue;
      }
      JsonNode child = root.get(field);
      if (child == null || child.isNull()) {
        continue;
      }
      JsonNode entry = firstEntry(child);
      if (entry != null) {
        return entry;
      }
    }
    if (looksLikeCode(root)) {
      return root;
    }
    return null;
  }

  private JsonNode mergePrivateResult(JsonNode item) {
    if (item == null || !item.isObject()) {
      return null;
    }
    JsonNode codeData = item.get("codeData");
    JsonNode productData = item.get("productData");
    JsonNode packageData = item.get("packageData");
    JsonNode turnoverData = item.get("turnoverData");
    if (codeData == null && productData == null && !looksLikeCode(item)) {
      return null;
    }
    ObjectNode merged = objectMapper.createObjectNode();
    copyFields(merged, item);
    copyFields(merged, codeData);
    copyFields(merged, productData);
    copyFields(merged, packageData);
    copyFields(merged, turnoverData);
    JsonNode ownerInfo = turnoverData != null ? turnoverData.get("ownerInfo") : null;
    if (ownerInfo != null && ownerInfo.isObject()) {
      merged.set("ownerInfo", ownerInfo);
    }
    JsonNode issuerShort = item.get("issuerShortInfo");
    if (issuerShort == null && item.get("markingData") != null) {
      JsonNode marking = item.get("markingData");
      if (marking != null) {
        if (marking.get("issuerInfo") != null) {
          issuerShort = marking.get("issuerInfo");
          merged.set("issuerInfo", marking.get("issuerInfo"));
        }
      }
    }
    if (issuerShort != null) {
      merged.set("issuerShortInfo", issuerShort);
    }
    JsonNode firstWithdraw = item.get("firstWithdrawCodeStateUnchanged");
    if (firstWithdraw == null && codeData != null) {
      firstWithdraw = codeData.get("firstWithdrawCodeStateUnchanged");
    }
    if (firstWithdraw != null && !firstWithdraw.isNull()) {
      merged.set("firstWithdrawCodeStateUnchanged", firstWithdraw);
    }
    return merged;
  }

  private void copyFields(ObjectNode target, JsonNode source) {
    if (source == null || !source.isObject()) {
      return;
    }
    Iterator<Map.Entry<String, JsonNode>> fields = source.fields();
    while (fields.hasNext()) {
      Map.Entry<String, JsonNode> field = fields.next();
      if (!target.has(field.getKey())) {
        target.set(field.getKey(), field.getValue());
      }
    }
  }

  private boolean looksLikeCode(JsonNode node) {
    return hasText(node, "gtin")
      || hasText(node, "productGtin")
      || hasText(node, "gtin14")
      || hasText(node, "status")
      || hasText(node, "codeStatus")
      || hasText(node, "state")
      || hasText(node, "productName")
      || hasText(node, "name")
      || hasText(node, "cis")
      || hasText(node, "km")
      || hasText(node, "code")
      || hasText(node, "markingCode")
      || (node.get("codeData") != null && node.get("codeData").isObject());
  }

  private String firstText(JsonNode node, String... fields) {
    String direct = text(node, fields);
    if (StringUtils.hasText(direct)) {
      return direct;
    }
    for (String nested : NESTED_FIELDS) {
      JsonNode child = node.get(nested);
      if (child != null && child.isObject()) {
        String value = text(child, fields);
        if (StringUtils.hasText(value)) {
          return value;
        }
      }
    }
    return null;
  }

  private String nestedText(JsonNode node, String objectField, String... fields) {
    if (node == null) {
      return null;
    }
    JsonNode child = node.get(objectField);
    if (child == null || !child.isObject()) {
      return null;
    }
    return text(child, fields);
  }

  private String text(JsonNode node, String... fields) {
    if (node == null) {
      return null;
    }
    for (String field : fields) {
      JsonNode value = node.get(field);
      if (value != null && !value.isNull() && value.isValueNode() && StringUtils.hasText(value.asText())) {
        return value.asText();
      }
    }
    return null;
  }

  private boolean hasText(JsonNode node, String field) {
    return StringUtils.hasText(text(node, field));
  }

  private String firstNonBlank(String primary, String fallback) {
    return StringUtils.hasText(primary) ? primary : fallback;
  }

  private String errorText(JsonNode root) {
    if (root == null || root.isNull()) {
      return null;
    }
    if (root.isArray()) {
      for (JsonNode item : root) {
        String message = errorText(item);
        if (StringUtils.hasText(message)) {
          return message;
        }
      }
      return null;
    }
    if (!root.isObject()) {
      return null;
    }
    String direct = text(root, "message", "errorMessage", "detail", "description", "error");
    if (StringUtils.hasText(direct) && !direct.startsWith("{")) {
      return direct;
    }
    JsonNode context = root.get("context");
    if (context != null && context.isObject()) {
      String description = text(context, "description", "message", "specificError");
      if (StringUtils.hasText(description)) {
        return description;
      }
    }
    JsonNode error = root.get("error");
    if (error != null && error.isTextual() && StringUtils.hasText(error.asText())) {
      return error.asText();
    }
    String code = text(root, "code", "errorCode");
    if (StringUtils.hasText(code)) {
      return code;
    }
    return null;
  }

  private Map<String, Object> toFlatMap(JsonNode node) {
    Map<String, Object> map = new HashMap<>();
    Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
    while (fields.hasNext()) {
      Map.Entry<String, JsonNode> field = fields.next();
      JsonNode value = field.getValue();
      if (value == null || value.isNull()) {
        continue;
      }
      if (value.isValueNode()) {
        map.put(field.getKey(), value.asText());
      } else {
        map.put(field.getKey(), value.toString());
      }
    }
    return map;
  }

  private MarkingVerifyResponse empty(String code) {
    return new MarkingVerifyResponse(false, code, null, null, null, null, null, null, Map.of(), false);
  }
}
