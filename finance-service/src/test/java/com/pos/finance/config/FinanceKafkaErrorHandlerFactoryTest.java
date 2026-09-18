package com.pos.finance.config;

import com.pos.shared.kafka.KafkaTopics;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FinanceKafkaErrorHandlerFactoryTest {

    @Test
    void financeDlqTopicConstant() {
        assertEquals(KafkaTopics.FINANCE_DLQ, FinanceKafkaErrorHandlerFactory.financeDlqTopic());
        assertEquals("pos.finance.dlq", KafkaTopics.FINANCE_DLQ);
    }
}
