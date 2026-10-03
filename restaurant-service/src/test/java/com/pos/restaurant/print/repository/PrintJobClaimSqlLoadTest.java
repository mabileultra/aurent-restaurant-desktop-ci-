package com.pos.restaurant.print.repository;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Runs the real native SQL from {@link RestaurantPrintJobRepository} on Postgres (Testcontainers):
 * fair share per printer, busy printers, concurrent desktops (SKIP LOCKED) and claim latency
 * with a big backlog. No Spring context — the @Query text is read by reflection.
 */
@Testcontainers(disabledWithoutDocker = true)
class PrintJobClaimSqlLoadTest {

    private static final int COMPANY = 7;
    private static final int STORE = 1;
    private static final List<String> PRINTERS = IntStream.rangeClosed(1, 10)
        .mapToObj(i -> String.format("xp-80 station %02d", i))
        .toList();

    private static final PostgreSQLContainer<?> PG = new PostgreSQLContainer<>("postgres:15-alpine");
    private static HikariDataSource pool;
    private static NamedParameterJdbcTemplate jdbc;
    private static String claimSql;
    private static String reclaimSql;

    private Instant clock;

    @BeforeAll
    static void startDb() throws Exception {
        PG.start();
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(PG.getJdbcUrl());
        ds.setUsername(PG.getUsername());
        ds.setPassword(PG.getPassword());
        ds.setMaximumPoolSize(12);
        pool = ds;
        jdbc = new NamedParameterJdbcTemplate(ds);
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
            CREATE INDEX idx_rst_print_jobs_pending_printer
                ON restaurant_print_jobs (company_id, store_id, (lower(coalesce(payload::json->>'printerName', ''))), created_at)
                WHERE status = 'PENDING';
            """);
        claimSql = querySql("claimPendingFilteredIds");
        reclaimSql = querySql("reclaimStaleClaims");
    }

    @AfterAll
    static void stopDb() {
        pool.close();
        PG.stop();
    }

    @BeforeEach
    void clean() throws Exception {
        jdbc.getJdbcTemplate().execute("TRUNCATE restaurant_print_jobs");
        clock = Instant.parse("2026-10-02T12:00:00Z");
        warmUp();
    }

    /** Open pooled connections and JIT the claim path so latency numbers measure SQL, not startup. */
    private void warmUp() throws Exception {
        ExecutorService warm = Executors.newFixedThreadPool(4);
        List<Future<?>> runs = new ArrayList<>();
        for (int t = 0; t < 4; t++) {
            runs.add(warm.submit(() -> {
                for (int i = 0; i < 20; i++) claim(PRINTERS, List.of(), 3, 24);
                return null;
            }));
        }
        for (Future<?> run : runs) run.get(1, TimeUnit.MINUTES);
        warm.shutdown();
    }

    @Test
    void claimSqlUsesCastSoHibernateCannotEatPostgresColonCast() {
        assertThat(claimSql).containsIgnoringCase("CAST(payload AS json)");
        assertThat(claimSql).doesNotContain("payload::json");
        assertThat(claimSql).doesNotContain("payload:json");
    }

    @Test
    void deepBacklogOnOnePrinterDoesNotHideTheOtherNine() {
        insertSlips(PRINTERS.get(0), 2_000);
        for (int round = 0; round < 20; round++) {
            for (String printer : PRINTERS.subList(1, 10)) {
                insertSlips(printer, 1);
            }
        }

        Map<String, Integer> perPrinter = countByPrinter(claim(PRINTERS, List.of(), 3, 25));

        assertThat(perPrinter.keySet()).containsExactlyInAnyOrderElementsOf(PRINTERS);
        assertThat(perPrinter.values()).allMatch(n -> n <= 3);
    }

    @Test
    void busyPrinterIsSkippedAndOthersStillServed() {
        for (String printer : PRINTERS) {
            insertSlips(printer, 50);
        }

        Map<String, Integer> perPrinter = countByPrinter(claim(PRINTERS, List.of(PRINTERS.get(0)), 3, 25));

        assertThat(perPrinter.keySet()).containsExactlyInAnyOrderElementsOf(PRINTERS.subList(1, 10));
        assertThat(perPrinter.values()).allMatch(n -> n <= 3);
        assertThat(perPrinter.values().stream().mapToInt(Integer::intValue).sum()).isEqualTo(25);
    }

    @Test
    void guestBillAndKitchenSendStillClaimedNextToSlips() {
        for (String printer : PRINTERS) {
            insertSlips(printer, 2);
        }
        insert("GUEST_BILL", "{\"orderId\":1}");
        insert("KITCHEN_SEND", "{\"orderId\":1}");
        for (String printer : PRINTERS) {
            insertSlips(printer, 5);
        }

        List<UUID> ids = claim(PRINTERS, List.of(), 3, 25, true, true);

        assertThat(kinds(ids)).contains("GUEST_BILL", "KITCHEN_SEND");
        assertThat(ids).hasSize(25);
    }

    @Test
    void staleClaimIsReclaimedOnlyAfter45s() {
        insertSlips(PRINTERS.get(0), 1);
        assertThat(claim(PRINTERS, List.of(), 3, 25)).hasSize(1);

        clock = clock.plusSeconds(30);
        assertThat(claim(PRINTERS, List.of(), 3, 25)).isEmpty();

        clock = clock.plusSeconds(20);
        assertThat(claim(PRINTERS, List.of(), 3, 25)).hasSize(1);
    }

    /** 3 desktops hammer the same store: 3 000 slips, every slip claimed by exactly one of them. */
    @Test
    void concurrentDesktopsNeverClaimTheSameSlipTwice() throws Exception {
        for (int round = 0; round < 300; round++) {
            for (String printer : PRINTERS) {
                insertSlips(printer, 1);
            }
        }
        // TRUNCATE keeps the previous test's planner stats (120k rows); prod has autovacuum for this.
        jdbc.getJdbcTemplate().execute("ANALYZE restaurant_print_jobs");
        Map<UUID, Integer> claimedBy = new ConcurrentHashMap<>();
        AtomicInteger duplicates = new AtomicInteger();
        List<Long> latenciesUs = Collections.synchronizedList(new ArrayList<>());
        int desktops = Integer.getInteger("desktops", 3);
        ExecutorService pool = Executors.newFixedThreadPool(desktops);
        CountDownLatch go = new CountDownLatch(1);
        List<Future<?>> runs = new ArrayList<>();
        for (int d = 0; d < desktops; d++) {
            int desktop = d;
            runs.add(pool.submit(() -> {
                go.await();
                int idle = 0;
                while (idle < 3) {
                    long t0 = System.nanoTime();
                    List<UUID> ids = claim(PRINTERS, List.of(), 3, 24);
                    latenciesUs.add((System.nanoTime() - t0) / 1_000);
                    if (ids.isEmpty()) {
                        idle++;
                        continue;
                    }
                    idle = 0;
                    for (UUID id : ids) {
                        if (claimedBy.putIfAbsent(id, desktop) != null) duplicates.incrementAndGet();
                    }
                    ack(ids);
                }
                return null;
            }));
        }
        go.countDown();
        for (Future<?> run : runs) run.get(2, TimeUnit.MINUTES);
        pool.shutdown();

        assertThat(duplicates.get()).isZero();
        assertThat(claimedBy).hasSize(3_000);
        assertThat(countStatus("DONE")).isEqualTo(3_000);
        report(desktops + " desktops, 3000 slips", latenciesUs);
        assertThat(percentile(latenciesUs, 95)).isLessThan(50_000);
    }

    /** Rush-hour backlog: 20 000 pending slips on 10 printers + 100 000 printed rows of history. */
    @Test
    void claimStaysFastWithHugeBacklog() {
        jdbc.getJdbcTemplate().execute("""
            INSERT INTO restaurant_print_jobs (id, company_id, store_id, kind, payload, status, created_at, completed_at)
            SELECT gen_random_uuid(), 7, 1, 'CATEGORY_SLIP',
                   '{"printerName":"XP-80 Station ' || lpad(((g % 10) + 1)::text, 2, '0') || '","itemName":"x"}',
                   'DONE', TIMESTAMPTZ '2026-10-02 11:00:00Z' + g * INTERVAL '1 ms', NOW()
            FROM generate_series(1, 100000) g;
            INSERT INTO restaurant_print_jobs (id, company_id, store_id, kind, payload, status, created_at)
            SELECT gen_random_uuid(), 7, 1, 'CATEGORY_SLIP',
                   '{"printerName":"XP-80 Station ' || lpad(((g % 10) + 1)::text, 2, '0') || '","itemName":"x"}',
                   'PENDING', TIMESTAMPTZ '2026-10-02 11:30:00Z' + g * INTERVAL '1 ms'
            FROM generate_series(1, 20000) g;
            ANALYZE restaurant_print_jobs;
            """);

        List<Long> latenciesUs = new ArrayList<>();
        for (int i = 0; i < 300; i++) {
            long t0 = System.nanoTime();
            List<UUID> ids = claim(PRINTERS, List.of(PRINTERS.get(i % 10)), 3, 24);
            latenciesUs.add((System.nanoTime() - t0) / 1_000);
            assertThat(ids).hasSize(24);
            ack(ids);
        }

        report("20k pending + 100k history", latenciesUs);
        assertThat(percentile(latenciesUs, 95)).isLessThan(50_000);
    }

    /**
     * 2 000 new slips per second for 5 s from 8 order threads (waiters' tablets), while one Aurent PC
     * with 20 printers claims + acks non-stop. Writes and claims must not block each other.
     */
    @Test
    void twoThousandSlipsPerSecondWhileOnePcClaimsForTwentyPrinters() throws Exception {
        List<String> printers20 = IntStream.rangeClosed(1, 20)
            .mapToObj(i -> String.format("xp-80 station %02d", i))
            .toList();
        int producers = 8;
        int seconds = 5;
        int perSecond = 2_000;
        int perThreadTick = perSecond / 10 / producers;
        int total = perSecond * seconds;
        Instant base = clock;
        AtomicInteger seq = new AtomicInteger();
        List<Long> insertUs = Collections.synchronizedList(new ArrayList<>());
        List<Long> claimUs = Collections.synchronizedList(new ArrayList<>());
        Map<UUID, Boolean> claimed = new ConcurrentHashMap<>();
        AtomicInteger duplicates = new AtomicInteger();
        // Claim "now" must be ahead of every created_at, like wall clock on the server.
        clock = base.plusSeconds(60);

        ExecutorService exec = Executors.newFixedThreadPool(producers + 1);
        CountDownLatch go = new CountDownLatch(1);
        List<Future<?>> producerRuns = new ArrayList<>();
        long t0 = System.nanoTime();
        for (int p = 0; p < producers; p++) {
            producerRuns.add(exec.submit(() -> {
                go.await();
                for (int tick = 0; tick < seconds * 10; tick++) {
                    long due = t0 + tick * 100_000_000L;
                    long sleepNs = due - System.nanoTime();
                    if (sleepNs > 0) TimeUnit.NANOSECONDS.sleep(sleepNs);
                    for (int i = 0; i < perThreadTick; i++) {
                        int n = seq.incrementAndGet();
                        String printer = printers20.get(n % printers20.size()).toUpperCase();
                        long s0 = System.nanoTime();
                        jdbc.update("""
                            INSERT INTO restaurant_print_jobs (id, company_id, store_id, kind, payload, status, created_at)
                            VALUES (:id, :company, :store, 'CATEGORY_SLIP', :payload, 'PENDING', :createdAt)
                            """, new MapSqlParameterSource()
                            .addValue("id", UUID.randomUUID())
                            .addValue("company", COMPANY)
                            .addValue("store", STORE)
                            .addValue("payload", "{\"printerName\":\"" + printer + "\",\"itemName\":\"x\"}")
                            .addValue("createdAt", Timestamp.from(base.plusNanos(n * 1_000L))));
                        insertUs.add((System.nanoTime() - s0) / 1_000);
                    }
                }
                return null;
            }));
        }
        Future<?> desktop = exec.submit(() -> {
            go.await();
            int idle = 0;
            while (idle < 20 || producerRuns.stream().anyMatch(f -> !f.isDone())) {
                long s0 = System.nanoTime();
                List<UUID> ids = claim(printers20, List.of(), 3, 25);
                claimUs.add((System.nanoTime() - s0) / 1_000);
                if (ids.isEmpty()) {
                    idle++;
                    TimeUnit.MILLISECONDS.sleep(5);
                    continue;
                }
                idle = 0;
                for (UUID id : ids) {
                    if (claimed.putIfAbsent(id, Boolean.TRUE) != null) duplicates.incrementAndGet();
                }
                ack(ids);
            }
            return null;
        });
        go.countDown();
        for (Future<?> run : producerRuns) run.get(2, TimeUnit.MINUTES);
        double insertSec = (System.nanoTime() - t0) / 1e9;
        desktop.get(2, TimeUnit.MINUTES);
        exec.shutdown();

        report("2000/s inserts (" + producers + " threads, " + String.format("%.1f", insertSec) + "s)", insertUs);
        report("1 PC claims, 20 printers, under 2000/s writes", claimUs);
        assertThat(seq.get()).isEqualTo(total);
        // The producers kept the 2 000/s pace — inserts did not queue up behind claims.
        assertThat(insertSec).isLessThan(seconds * 1.3);
        assertThat(duplicates.get()).isZero();
        assertThat(claimed).hasSize(total);
        assertThat(countStatus("DONE")).isEqualTo(total);
        assertThat(percentile(insertUs, 95)).isLessThan(20_000);
        assertThat(percentile(claimUs, 95)).isLessThan(50_000);
    }

    private List<UUID> claim(List<String> printers, List<String> busy, int perLane, int batch) {
        return claim(printers, busy, perLane, batch, false, false);
    }

    private List<UUID> claim(
        List<String> printers,
        List<String> busy,
        int perLane,
        int batch,
        boolean guestBill,
        boolean kitchenSend
    ) {
        Instant now = clock;
        jdbc.update(reclaimSql, new MapSqlParameterSource()
            .addValue("companyId", COMPANY)
            .addValue("storeId", STORE)
            .addValue("staleBefore", Timestamp.from(now.minus(Duration.ofSeconds(45)))));
        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("companyId", COMPANY)
            .addValue("storeId", STORE)
            .addValue("since", Timestamp.from(now.minus(Duration.ofHours(6))))
            .addValue("now", Timestamp.from(now))
            .addValue("batch", batch)
            .addValue("perLane", perLane)
            .addValue("guestBill", guestBill ? 1 : 0)
            .addValue("kitchenSend", kitchenSend ? 1 : 0)
            .addValue("hasPrinters", printers.isEmpty() ? 0 : 1)
            .addValue("printers", printers.isEmpty() ? List.of("__none__") : printers)
            .addValue("busyPrinters", busy.isEmpty() ? List.of("__none__") : busy);
        return jdbc.queryForList(claimSql, params, UUID.class);
    }

    private void ack(Collection<UUID> ids) {
        jdbc.update(
            "UPDATE restaurant_print_jobs SET status = 'DONE', completed_at = NOW() WHERE id IN (:ids)",
            Map.of("ids", ids)
        );
    }

    private void insertSlips(String printer, int count) {
        for (int i = 0; i < count; i++) {
            insert("CATEGORY_SLIP", "{\"printerName\":\"" + printer.toUpperCase() + "\",\"itemName\":\"x\"}");
        }
    }

    private void insert(String kind, String payload) {
        clock = clock.plusMillis(1);
        jdbc.update("""
            INSERT INTO restaurant_print_jobs (id, company_id, store_id, kind, payload, status, created_at)
            VALUES (:id, :company, :store, :kind, :payload, 'PENDING', :createdAt)
            """, new MapSqlParameterSource()
            .addValue("id", UUID.randomUUID())
            .addValue("company", COMPANY)
            .addValue("store", STORE)
            .addValue("kind", kind)
            .addValue("payload", payload)
            .addValue("createdAt", Timestamp.from(clock)));
    }

    private Map<String, Integer> countByPrinter(List<UUID> ids) {
        Map<String, Integer> counts = new HashMap<>();
        if (ids.isEmpty()) return counts;
        jdbc.query(
            "SELECT lower(payload::json->>'printerName') AS p FROM restaurant_print_jobs WHERE id IN (:ids)",
            Map.of("ids", ids),
            rs -> {
                counts.merge(rs.getString("p"), 1, Integer::sum);
            }
        );
        return counts;
    }

    private Set<String> kinds(List<UUID> ids) {
        return new HashSet<>(jdbc.queryForList(
            "SELECT kind FROM restaurant_print_jobs WHERE id IN (:ids)",
            Map.of("ids", ids),
            String.class
        ));
    }

    private int countStatus(String status) {
        Integer n = jdbc.queryForObject(
            "SELECT count(*) FROM restaurant_print_jobs WHERE status = :s",
            Map.of("s", status),
            Integer.class
        );
        return n == null ? 0 : n;
    }

    private static long percentile(List<Long> values, int p) {
        List<Long> sorted = new ArrayList<>(values);
        Collections.sort(sorted);
        return sorted.get(Math.min(sorted.size() - 1, (int) Math.floor(p / 100.0 * sorted.size())));
    }

    private static void report(String label, List<Long> latenciesUs) {
        System.out.printf(
            "[print-claim %s] claims=%d p50=%.1fms p95=%.1fms max=%.1fms%n",
            label,
            latenciesUs.size(),
            percentile(latenciesUs, 50) / 1000.0,
            percentile(latenciesUs, 95) / 1000.0,
            Collections.max(latenciesUs) / 1000.0
        );
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
