package com.pos.integrations.pharmacy.support;

import org.springframework.stereotype.Component;

/**
 * Thread-local контекст исходящего вызова ASL — заполняется сервисом, HTTP-статус пишет клиент.
 */
@Component
public class AslRequestLogCallScope {

  private static final ThreadLocal<AslRequestLogCallContext> CURRENT = new ThreadLocal<>();

  public void open(AslRequestLogCallContext context) {
    CURRENT.set(context);
  }

  public AslRequestLogCallContext current() {
    return CURRENT.get();
  }

  public void noteHttp(Integer status, String endpoint) {
    AslRequestLogCallContext ctx = CURRENT.get();
    if (ctx != null) {
      ctx.noteHttp(status, endpoint);
    }
  }

  public AslRequestLogCallContext close() {
    AslRequestLogCallContext ctx = CURRENT.get();
    CURRENT.remove();
    return ctx;
  }
}
