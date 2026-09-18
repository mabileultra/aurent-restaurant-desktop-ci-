package com.pos.finance.service.support;

import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.repository.FinancialAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AccountBalanceSupportReverseCreditTest {

    @Mock
    private FinancialAccountRepository accountRepository;

    private AccountBalanceSupport balanceSupport;

    @BeforeEach
    void setUp() {
        balanceSupport = new AccountBalanceSupport(accountRepository);
    }

    @Test
    void subtractsDuplicateCredit() {
        FinancialAccount account = FinancialAccount.builder()
            .name("Касса")
            .balance(new BigDecimal("150000"))
            .build();

        balanceSupport.reverseCredit(account, new BigDecimal("50000"));

        assertEquals(new BigDecimal("100000"), account.getBalance());
        verify(accountRepository).save(account);
    }

    @Test
    void clampsToZeroWhenDuplicateWasAlreadySpent() {
        FinancialAccount account = FinancialAccount.builder()
            .name("Касса")
            .balance(new BigDecimal("10000"))
            .build();

        balanceSupport.reverseCredit(account, new BigDecimal("50000"));

        assertEquals(BigDecimal.ZERO, account.getBalance());
    }
}
