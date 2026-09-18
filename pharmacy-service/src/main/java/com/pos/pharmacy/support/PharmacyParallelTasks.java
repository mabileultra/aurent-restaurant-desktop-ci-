package com.pos.pharmacy.support;

import com.pos.pharmacy.exception.PharmacyException;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.Executor;
import java.util.function.Supplier;

/** Общий join параллельных задач с отменой остальных при первой ошибке. */
public final class PharmacyParallelTasks {

    private PharmacyParallelTasks() {
    }

    public static void runAll(List<Runnable> tasks, Executor executor) {
        if (tasks == null || tasks.isEmpty()) {
            return;
        }
        List<CompletableFuture<Void>> futures = new ArrayList<>(tasks.size());
        for (Runnable task : tasks) {
            futures.add(CompletableFuture.runAsync(task, executor));
        }
        joinAll(futures);
    }

    public static <T> List<T> supplyAll(List<Supplier<T>> tasks, Executor executor) {
        if (tasks == null || tasks.isEmpty()) {
            return List.of();
        }
        List<CompletableFuture<T>> futures = new ArrayList<>(tasks.size());
        for (Supplier<T> task : tasks) {
            futures.add(CompletableFuture.supplyAsync(task, executor));
        }
        List<T> results = new ArrayList<>(futures.size());
        for (int i = 0; i < futures.size(); i++) {
            try {
                results.add(futures.get(i).join());
            } catch (CompletionException ex) {
                futures.forEach(future -> future.cancel(true));
                throw unwrap(ex);
            } catch (RuntimeException ex) {
                futures.forEach(future -> future.cancel(true));
                throw ex;
            }
        }
        return results;
    }

    public static void joinAll(List<? extends CompletableFuture<?>> futures) {
        for (int i = 0; i < futures.size(); i++) {
            try {
                futures.get(i).join();
            } catch (CompletionException ex) {
                futures.forEach(future -> future.cancel(true));
                throw unwrap(ex);
            }
        }
    }

    private static RuntimeException unwrap(CompletionException ex) {
        Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
        if (cause instanceof PharmacyException pharmacyException) {
            return pharmacyException;
        }
        if (cause instanceof RuntimeException runtimeException) {
            return runtimeException;
        }
        return new IllegalStateException(cause);
    }
}
