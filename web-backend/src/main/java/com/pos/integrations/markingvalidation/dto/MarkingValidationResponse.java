package com.pos.integrations.markingvalidation.dto;

/**
 * VALID — можно отправлять чек в ФМ; REJECTED — налоговая отказала (code 1001…2090);
 * UNAVAILABLE — проверка не состоялась (сеть, авторизация, не настроено).
 */
public record MarkingValidationResponse(
    Status status,
    String code,
    String message,
    String messageUz
) {

    public enum Status { VALID, REJECTED, UNAVAILABLE }

    public static MarkingValidationResponse valid() {
        return new MarkingValidationResponse(Status.VALID, null, null, null);
    }

    public static MarkingValidationResponse rejected(String code, String messageRu, String messageUz) {
        return new MarkingValidationResponse(Status.REJECTED, code, messageRu, messageUz);
    }

    public static MarkingValidationResponse unavailable(String code, String messageRu) {
        return new MarkingValidationResponse(Status.UNAVAILABLE, code, messageRu, null);
    }
}
