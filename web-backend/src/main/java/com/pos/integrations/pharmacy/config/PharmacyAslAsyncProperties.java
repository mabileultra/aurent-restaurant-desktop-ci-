package com.pos.integrations.pharmacy.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.pharmacy.asl")
public class PharmacyAslAsyncProperties {

  private int connectTimeoutMs = 3_000;
  private int readTimeoutMs = 5_000;
  private final PoolProperties markVerify = new PoolProperties(8, 16, 300, "asl-mark-verify-");
  private final PoolProperties markWithdraw = new PoolProperties(4, 8, 500, "asl-mark-withdraw-");

  public int getConnectTimeoutMs() {
    return connectTimeoutMs;
  }

  public void setConnectTimeoutMs(int connectTimeoutMs) {
    this.connectTimeoutMs = connectTimeoutMs;
  }

  public int getReadTimeoutMs() {
    return readTimeoutMs;
  }

  public void setReadTimeoutMs(int readTimeoutMs) {
    this.readTimeoutMs = readTimeoutMs;
  }

  public PoolProperties getMarkVerify() {
    return markVerify;
  }

  public PoolProperties getMarkWithdraw() {
    return markWithdraw;
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
