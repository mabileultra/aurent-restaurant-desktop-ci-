package com.pos.integrations.pharmacy.domain;

/**
 * Результат попытки связаться с ASL Belgisi.
 * SENT_* — HTTP-вызов ушёл; NOT_SENT — локально без ключа / без сети к ASL.
 */
public enum AslRequestOutcome {
  SENT_OK,
  SENT_FAIL,
  SENT_WAITING,
  NOT_SENT
}
