package com.pos.pharmacy.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Пулы потоков pharmacy-service: импорт, каталог, verify/withdraw КМ.
 * Не больше Hikari maximum-pool-size, иначе потоки будут ждать БД.
 */
@ConfigurationProperties(prefix = "app.pharmacy.async")
public class PharmacyAsyncProperties {

    private final PoolProperties markVerify = new PoolProperties(8, 8, 200, "pharm-mark-verify-");
    private final PoolProperties markWithdraw = new PoolProperties(4, 8, 500, "pharm-mark-withdraw-");
    private final PoolProperties importPool = new PoolProperties(8, 8, 2000, "pharm-import-");
    private final PoolProperties catalog = new PoolProperties(4, 8, 100, "pharm-catalog-");
    private final PoolProperties revenueOutbox = new PoolProperties(4, 8, 500, "pharm-revenue-outbox-");

    public PoolProperties getMarkVerify() {
        return markVerify;
    }

    public PoolProperties getMarkWithdraw() {
        return markWithdraw;
    }

    public PoolProperties getImportPool() {
        return importPool;
    }

    public PoolProperties getCatalog() {
        return catalog;
    }

    public PoolProperties getRevenueOutbox() {
        return revenueOutbox;
    }

    public static class PoolProperties {
        private int corePoolSize;
        private int maxPoolSize;
        private int queueCapacity;
        private String threadNamePrefix;

        public PoolProperties() {
        }

        public PoolProperties(int corePoolSize, int maxPoolSize, int queueCapacity, String threadNamePrefix) {
            this.corePoolSize = corePoolSize;
            this.maxPoolSize = maxPoolSize;
            this.queueCapacity = queueCapacity;
            this.threadNamePrefix = threadNamePrefix;
        }

        public int getCorePoolSize() {
            return corePoolSize;
        }

        public void setCorePoolSize(int corePoolSize) {
            this.corePoolSize = corePoolSize;
        }

        public int getMaxPoolSize() {
            return maxPoolSize;
        }

        public void setMaxPoolSize(int maxPoolSize) {
            this.maxPoolSize = maxPoolSize;
        }

        public int getQueueCapacity() {
            return queueCapacity;
        }

        public void setQueueCapacity(int queueCapacity) {
            this.queueCapacity = queueCapacity;
        }

        public String getThreadNamePrefix() {
            return threadNamePrefix;
        }

        public void setThreadNamePrefix(String threadNamePrefix) {
            this.threadNamePrefix = threadNamePrefix;
        }
    }
}
