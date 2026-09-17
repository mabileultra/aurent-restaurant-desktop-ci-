package com.pos.pharmacy.warehouse.support;

import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;

/** Общий пул для массового импорта, проведения и списания. Не больше пула соединений. */
@Component
public class PharmacyMassExecutor {

    public static final int THREADS = 8;

    private final ExecutorService executor;

    public PharmacyMassExecutor() {
        this.executor = Executors.newFixedThreadPool(THREADS, namedThreads());
    }

    public ExecutorService executor() {
        return executor;
    }

    @PreDestroy
    public void shutdown() {
        executor.shutdown();
    }

    private static ThreadFactory namedThreads() {
        AtomicInteger seq = new AtomicInteger();
        return task -> {
            Thread thread = new Thread(task, "pharmacy-mass-" + seq.incrementAndGet());
            thread.setDaemon(true);
            return thread;
        };
    }
}
