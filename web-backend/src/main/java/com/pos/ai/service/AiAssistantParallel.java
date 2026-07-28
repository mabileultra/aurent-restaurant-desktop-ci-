package com.pos.ai.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.function.Supplier;

@Component
public class AiAssistantParallel {

    private final Executor executor;
    private final TransactionTemplate readOnlyTx;

    public AiAssistantParallel(
            @Qualifier("aiAssistantExecutor") Executor executor,
            PlatformTransactionManager transactionManager
    ) {
        this.executor = executor;
        this.readOnlyTx = new TransactionTemplate(transactionManager);
        this.readOnlyTx.setReadOnly(true);
    }

    public <T> CompletableFuture<T> supply(Supplier<T> supplier) {
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        return CompletableFuture.supplyAsync(
                () -> executeWithRequestContext(requestAttributes, supplier),
                executor
        );
    }

    private <T> T executeWithRequestContext(RequestAttributes requestAttributes, Supplier<T> supplier) {
        if (requestAttributes != null) {
            RequestContextHolder.setRequestAttributes(requestAttributes, true);
        }
        try {
            return readOnlyTx.execute(status -> supplier.get());
        } finally {
            if (requestAttributes != null) {
                RequestContextHolder.resetRequestAttributes();
            }
        }
    }

    public static void awaitAll(CompletableFuture<?>... futures) {
        try {
            CompletableFuture.allOf(futures).join();
        } catch (java.util.concurrent.CompletionException ex) {
            Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
            if (cause instanceof RuntimeException runtime) {
                throw runtime;
            }
            throw new IllegalStateException(cause);
        }
    }
}
