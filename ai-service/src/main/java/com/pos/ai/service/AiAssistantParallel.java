package com.pos.ai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
public class AiAssistantParallel {

    private static final Executor EXECUTOR = Executors.newFixedThreadPool(10);

    public <T> CompletableFuture<T> supply(Supplier<T> supplier) {
        return CompletableFuture.supplyAsync(supplier, EXECUTOR);
    }

    public static void awaitAll(CompletableFuture<?>... futures) {
        CompletableFuture.allOf(futures).join();
    }
}
