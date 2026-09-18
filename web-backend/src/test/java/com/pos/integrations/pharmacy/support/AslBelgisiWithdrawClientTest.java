package com.pos.integrations.pharmacy.support;

import com.pos.integrations.pharmacy.dto.MarkingWithdrawItemResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AslBelgisiWithdrawClientTest {

  @Mock
  private AslBelgisiMarkingClient markingClient;

  @InjectMocks
  private AslBelgisiWithdrawClient withdrawClient;

  @Test
  void alreadyWithdrawnIsSuccess() {
    when(markingClient.verify(anyString(), anyString(), anyString()))
      .thenReturn(new com.pos.integrations.pharmacy.dto.MarkingVerifyResponse(
        true, "CODE", "WITHDRAWN", null, null, null, null, null, null, true
      ));

    MarkingWithdrawItemResult result = withdrawClient.confirm("https://xtrace", "key", "CODE", false);
    assertTrue(result.success());
    assertFalse(result.pending());
  }

  @Test
  void introducedWithoutFiscalStaysPending() {
    when(markingClient.verify(anyString(), anyString(), anyString()))
      .thenReturn(new com.pos.integrations.pharmacy.dto.MarkingVerifyResponse(
        true, "CODE", "INTRODUCED", null, null, null, null, null, null, false
      ));

    MarkingWithdrawItemResult result = withdrawClient.confirm("https://xtrace", "key", "CODE", false);
    assertFalse(result.success());
    assertTrue(result.pending());
  }

  @Test
  void fiscalConfirmedAcceptsWhileWaitingAsl() {
    when(markingClient.verify(anyString(), anyString(), anyString()))
      .thenReturn(new com.pos.integrations.pharmacy.dto.MarkingVerifyResponse(
        true, "CODE", "INTRODUCED", null, null, null, null, null, null, false
      ));

    MarkingWithdrawItemResult result = withdrawClient.confirm("https://xtrace", "key", "CODE", true);
    assertTrue(result.success());
  }
}
