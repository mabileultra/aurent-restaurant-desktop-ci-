package com.pos.integrations.pharmacy.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.integrations.pharmacy.dto.MarkingVerifyResponse;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public final class AslBelgisiResponseParser {

  private static final List<String> COLLECTION_FIELDS = List.of(
    "results", "codes", "result", "items", "data", "content"
  );
  private static final List<String> NESTED_FIELDS = List.of(
    "product", "productCard", "codeData", "publicData", "cisInfo", "info", "attributes"
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
      String status = firstText(entry, "status", "codeStatus", "state", "extendedStatus");
      boolean found = StringUtils.hasText(gtin) || StringUtils.hasText(productName) || StringUtils.hasText(status);
      if (!found) {
        return empty(requestedCode);
      }
      Map<String, Object> details = toFlatMap(entry);
      return new MarkingVerifyResponse(
        true,
        firstText(entry, "code", "cis", "km", "markingCode"),
        status,
        gtin,
        productName,
        firstText(entry, "expirationDate", "expiration_date", "expDate"),
        firstText(entry, "batch", "batchNumber", "series"),
        firstText(entry, "ownerInn", "ownerTin", "owner_inn", "issuerInn", "issuerTin"),
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
    for (String field : COLLECTION_FIELDS) {
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

  private boolean looksLikeCode(JsonNode node) {
    return hasText(node, "gtin")
      || hasText(node, "productGtin")
      || hasText(node, "status")
      || hasText(node, "codeStatus")
      || hasText(node, "productName")
      || hasText(node, "cis")
      || hasText(node, "km");
  }

  private String firstText(JsonNode node, String... fields) {
    String direct = text(node, fields);
    if (StringUtils.hasText(direct)) {
      return direct;
    }
    for (String nested : NESTED_FIELDS) {
      JsonNode child = node.get(nested);
      if (child != null && child.isObject()) {
        String value = firstText(child, fields);
        if (StringUtils.hasText(value)) {
          return value;
        }
      }
    }
    return null;
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
    String direct = text(root, "message", "errorMessage", "detail", "description");
    if (StringUtils.hasText(direct) && !direct.startsWith("{")) {
      return direct;
    }
    JsonNode context = root.get("context");
    if (context != null && context.isObject()) {
      String description = text(context, "description", "message");
      if (StringUtils.hasText(description)) {
        return description;
      }
    }
    JsonNode error = root.get("error");
    if (error != null && error.isTextual() && StringUtils.hasText(error.asText())) {
      return error.asText();
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
