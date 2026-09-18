package com.pos.pharmacy.support;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PharmacyParallelTasksTest {

    @Test
    void runAllExecutesTasks() {
        AtomicInteger counter = new AtomicInteger();
        ExecutorService pool = Executors.newFixedThreadPool(4);
        try {
            PharmacyParallelTasks.runAll(List.of(
                counter::incrementAndGet,
                counter::incrementAndGet,
                counter::incrementAndGet
            ), pool);
            assertEquals(3, counter.get());
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void supplyAllReturnsResultsInOrder() {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Integer> values = PharmacyParallelTasks.supplyAll(List.of(
                () -> 1,
                () -> 2,
                () -> 3
            ), pool);
            assertEquals(List.of(1, 2, 3), values);
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void runAllPropagatesRuntimeException() {
        ExecutorService pool = Executors.newSingleThreadExecutor();
        try {
            assertThrows(IllegalStateException.class, () -> PharmacyParallelTasks.runAll(List.of(
                () -> {
                    throw new IllegalStateException("boom");
                }
            ), pool));
        } finally {
            pool.shutdownNow();
        }
    }
}
