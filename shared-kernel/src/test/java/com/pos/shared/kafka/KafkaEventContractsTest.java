package com.pos.shared.kafka;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class KafkaEventContractsTest {

    @Test
    void mapsFinanceAndDlq() {
        assertEquals(
            FinanceIntegrationMessage.class.getName(),
            KafkaEventContracts.contractFor(KafkaTopics.FINANCE_INTEGRATION)
        );
        assertEquals(KafkaTopics.FINANCE_DLQ, KafkaEventContracts.dlqTopicFor(KafkaTopics.FINANCE_INTEGRATION));
        assertEquals(KafkaTopics.REPORTING_DLQ, KafkaEventContracts.dlqTopicFor(KafkaTopics.SALES_COMPLETED));
    }

    @Test
    void defaultsSchemaVersion() {
        FinanceIntegrationMessage msg = new FinanceIntegrationMessage(
            UUID.randomUUID(),
            "SALE",
            "/path",
            "key-1",
            "{}"
        );
        assertEquals(1, msg.schemaVersion());
    }
}
