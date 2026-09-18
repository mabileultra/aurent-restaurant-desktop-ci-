package com.pos.pharmacy.config;

import com.pos.shared.log.LogUtil;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

final class PharmacyThreadPoolFactory {

    private PharmacyThreadPoolFactory() {
    }

    static Executor create(PharmacyAsyncProperties.PoolProperties pool, Class<?> logSource) {
        int core = Math.max(1, pool.getCorePoolSize());
        int max = Math.max(core, pool.getMaxPoolSize());
        int queue = Math.max(1, pool.getQueueCapacity());

        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setThreadNamePrefix(pool.getThreadNamePrefix());
        executor.setCorePoolSize(core);
        executor.setMaxPoolSize(max);
        executor.setQueueCapacity(queue);
        executor.setAllowCoreThreadTimeOut(true);
        executor.setKeepAliveSeconds(60);
        // Не теряем задачи при переполнении — выполняем в вызывающем потоке.
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();

        LogUtil.info(
            logSource,
            "Pharmacy executor ready: prefix={}, core={}, max={}, queue={}",
            pool.getThreadNamePrefix(),
            core,
            max,
            queue
        );
        return executor;
    }
}
