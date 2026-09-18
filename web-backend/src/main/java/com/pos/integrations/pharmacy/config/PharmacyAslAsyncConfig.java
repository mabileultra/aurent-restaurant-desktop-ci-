package com.pos.integrations.pharmacy.config;

import com.pos.shared.log.LogUtil;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/** Пулы для параллельной проверки и вывода КМ в ASL (фаза 0). */
@Configuration
@EnableConfigurationProperties(PharmacyAslAsyncProperties.class)
public class PharmacyAslAsyncConfig {

  @Bean(name = PharmacyAslExecutorNames.MARK_VERIFY)
  public Executor aslMarkVerifyExecutor(PharmacyAslAsyncProperties properties) {
    return create(properties.getMarkVerify());
  }

  @Bean(name = PharmacyAslExecutorNames.MARK_WITHDRAW)
  public Executor aslMarkWithdrawExecutor(PharmacyAslAsyncProperties properties) {
    return create(properties.getMarkWithdraw());
  }

  private static Executor create(PharmacyAslAsyncProperties.PoolProperties pool) {
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
    executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    executor.initialize();

    LogUtil.info(
      PharmacyAslAsyncConfig.class,
      "ASL executor ready: prefix={}, core={}, max={}, queue={}",
      pool.getThreadNamePrefix(),
      core,
      max,
      queue
    );
    return executor;
  }
}
