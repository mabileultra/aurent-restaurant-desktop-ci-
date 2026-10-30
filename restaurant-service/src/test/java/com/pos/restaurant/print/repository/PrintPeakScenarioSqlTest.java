package com.pos.restaurant.print.repository;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.lang.reflect.Method;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Venue peak on real Postgres: 10 waiters send orders at the same time (one CATEGORY_BATCH per
 * station, like PrintJobPublisher) while the single laptop claims → acks in a loop, through the
 * same reclaim → expire → claim SQL as PrintJobServiceImpl. Nothing may be lost or handed out twice.
 */
@Testcontainers(disabledWithoutDocker = true)
class PrintPeakScenarioSqlTest {

    private static final List<String> STATIONS = List.of("kassa", "oshxona", "shashlik", "salat");
    private static final PostgreSQLContainer<?> PG = new PostgreSQLContainer<>("postgres:15-alpine");
    private static HikariDataSource pool;
    private static NamedParameterJdbcTemplate jdbc;

    @BeforeAll
    static void startDb() {
        PG.start();
        pool = new HikariDataSource();
        pool.setJdbcUrl(PG.getJdbcUrl());
        pool.setUsername(PG.getUsername());
        pool.setPassword(PG.getPassword());
        pool.setMaximumPoolSize(16);
        jdbc = new NamedParameterJdbcTemplate(pool);
        jdbc.getJdbcTemplate().execute("""
            CREATE TABLE restaurant_print_jobs (
                id UUID PRIMARY KEY,
                company_id INT NOT NULL,
                store_id INT NOT NULL,
                kind VARCHAR(32) NOT NULL,
                payload TEXT NOT NULL,
                status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                completed_at TIMESTAMP WITH TIME ZONE,
                claimed_at TIMESTAMP WITH TIME ZONE
            );
            CREATE INDEX idx_rst_print_jobs_store_pending
                ON restaurant_print_jobs (company_id, store_id, status, created_at);
            CREATE INDEX idx_rst_print_jobs_store_claimed
                ON restaurant_print_jobs (company_id, store_id, status, claimed_at);
            """);
    }

    @AfterAll
    static void stopDb() {
        pool.close();
        PG.stop();
    }

    @Test
    void tenWaitersSendWhileOneLaptopClaims() throws Exception {
        String reclaimSql = querySql("reclaimStaleClaims");
        String expireSql = querySql("expireStalePending");
        String claimSql = querySql("claimPendingFilteredIds");
        int waiters = 10;
        int ordersPerWaiter = 30;

        Map<UUID, Boolean> created = new ConcurrentHashMap<>();
        Map<UUID, Integer> claimedTimes = new ConcurrentHashMap<>();
        AtomicInteger bills = new AtomicInteger();
        AtomicBoolean sending = new AtomicBoolean(true);
        List<Long> claimUs = Collections.synchronizedList(new ArrayList<>());
        ExecutorService exec = Executors.newFixedThreadPool(waiters + 1);
        CountDownLatch go = new CountDownLatch(1);

        List<Future<?>> waiterRuns = new ArrayList<>();
        for (int w = 0; w < waiters; w++) {
            int seed = w;
            waiterRuns.add(exec.submit(() -> {
                Random rnd = new Random(seed);
                go.await();
                for (int o = 0; o < ordersPerWaiter; o++) {
                    List<String> stations = new ArrayList<>(STATIONS);
                    Collections.shuffle(stations, rnd);
                    for (String station : stations.subList(0, 2 + rnd.nextInt(3))) {
                        created.put(insert("CATEGORY_BATCH", "{\"printerName\":\"" + station + "\",\"lines\":[]}"), true);
                    }
                    if (rnd.nextInt(5) == 0) {
                        created.put(insert("GUEST_BILL", "{\"orderId\":\"x\"}"), true);
                        bills.incrementAndGet();
                    }
                    Thread.sleep(rnd.nextInt(20));
                }
                return null;
            }));
        }

        Future<?> laptop = exec.submit(() -> {
            go.await();
            int idle = 0;
            while (sending.get() || idle < 5) {
                Instant now = Instant.now();
                long t0 = System.nanoTime();
                jdbc.update(reclaimSql, new MapSqlParameterSource()
                    .addValue("companyId", 7).addValue("storeId", 1)
                    .addValue("staleBefore", Timestamp.from(now.minus(Duration.ofSeconds(45)))));
                jdbc.update(expireSql, new MapSqlParameterSource()
                    .addValue("companyId", 7).addValue("storeId", 1)
                    .addValue("billBefore", Timestamp.from(now.minus(Duration.ofMinutes(5))))
                    .addValue("slipBefore", Timestamp.from(now.minus(Duration.ofMinutes(20))))
                    .addValue("now", Timestamp.from(now)));
                List<UUID> ids = jdbc.queryForList(claimSql, new MapSqlParameterSource()
                    .addValue("companyId", 7).addValue("storeId", 1)
                    .addValue("since", Timestamp.from(now.minus(Duration.ofHours(6))))
                    .addValue("now", Timestamp.from(now))
                    .addValue("batch", 24).addValue("perLane", 3)
                    .addValue("guestBill", 1).addValue("orderCancel", 0).addValue("kitchenSend", 0).addValue("pickupLabel", 0).addValue("hasPrinters", 1)
                    .addValue("printers", STATIONS)
                    .addValue("busyPrinters", List.of("__none__")), UUID.class);
                claimUs.add((System.nanoTime() - t0) / 1_000);
                if (ids.isEmpty()) {
                    idle++;
                    Thread.sleep(20);
                    continue;
                }
                idle = 0;
                for (UUID id : ids) claimedTimes.merge(id, 1, Integer::sum);
                jdbc.update(
                    "UPDATE restaurant_print_jobs SET status = 'DONE', completed_at = NOW() WHERE id IN (:ids)",
                    Map.of("ids", ids)
                );
            }
            return null;
        });

        go.countDown();
        for (Future<?> run : waiterRuns) run.get(2, TimeUnit.MINUTES);
        sending.set(false);
        laptop.get(2, TimeUnit.MINUTES);
        exec.shutdown();

        List<Long> sorted = new ArrayList<>(claimUs);
        Collections.sort(sorted);
        long p95 = sorted.get((int) (sorted.size() * 0.95));
        System.out.printf("[venue peak] jobs=%d bills=%d claims=%d p50=%.1fms p95=%.1fms%n",
            created.size(), bills.get(), sorted.size(),
            sorted.get(sorted.size() / 2) / 1000.0, p95 / 1000.0);

        assertThat(claimedTimes.keySet()).containsExactlyInAnyOrderElementsOf(created.keySet());
        assertThat(claimedTimes.values()).allMatch(n -> n == 1);
        Integer leftover = jdbc.queryForObject(
            "SELECT count(*) FROM restaurant_print_jobs WHERE status <> 'DONE'", Map.of(), Integer.class);
        assertThat(leftover).isZero();
        assertThat(p95).isLessThan(50_000);
    }

    private static UUID insert(String kind, String payload) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
            INSERT INTO restaurant_print_jobs (id, company_id, store_id, kind, payload, status, created_at)
            VALUES (:id, 7, 1, :kind, :payload, 'PENDING', clock_timestamp())
            """, new MapSqlParameterSource()
            .addValue("id", id)
            .addValue("kind", kind)
            .addValue("payload", payload));
        return id;
    }

    private static String querySql(String methodName) {
        for (Method method : RestaurantPrintJobRepository.class.getDeclaredMethods()) {
            if (method.getName().equals(methodName)) {
                return method.getAnnotation(Query.class).value();
            }
        }
        throw new IllegalStateException("No @Query " + methodName);
    }
}
