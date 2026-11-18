package com.itstudy;

import com.itstudy.dto.ExchangeResult;
import com.itstudy.mapper.PointLogMapper;
import com.itstudy.mapper.ResourceExchangeMapper;
import com.itstudy.service.ResourceService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 并发兑换：不能用 @Transactional（线程看不到未提交的数据），改用 JdbcTemplate 造已提交数据，结束后手工清理。
 */
class ResourceExchangeConcurrencyTest extends BaseIntegrationTest {

    private static final int THREADS = 4;
    private static final int INITIAL_POINTS = 20;
    private static final int COST = 5;

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private ResourceService resourceService;
    @Autowired
    private ResourceExchangeMapper exchangeMapper;
    @Autowired
    private PointLogMapper pointLogMapper;

    private Long userId;
    private Long sectionId;
    private Long resourceId;

    @BeforeEach
    void insertCommittedFixtures() {
        String suffix = System.nanoTime() + "";
        LocalDateTime now = LocalDateTime.now();

        jdbcTemplate.update("INSERT INTO app_user (username, password_hash, nickname, avatar_hue, points, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                "cu" + suffix, "x", "并发买家", 210, INITIAL_POINTS, now, now);
        userId = jdbcTemplate.queryForObject("SELECT id FROM app_user WHERE username = ?", Long.class, "cu" + suffix);

        jdbcTemplate.update("INSERT INTO section (code, name, tagline, description, icon, accent, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
                "cs" + suffix, "并发布告", "并发布告", "并发布告", "Code2", "sky", 0);
        sectionId = jdbcTemplate.queryForObject("SELECT id FROM section WHERE code = ?", Long.class, "cs" + suffix);

        jdbcTemplate.update("INSERT INTO resource (section_id, uploader_id, title, description, file_name, file_type, file_size, points, download_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                sectionId, userId, "并发讲义", "并发测试资源", "concurrency.md", "MD", 2048L, COST, 0, now);
        resourceId = jdbcTemplate.queryForObject("SELECT id FROM resource WHERE title = ? AND section_id = ?", Long.class, "并发讲义", sectionId);
    }

    @AfterEach
    void cleanup() {
        if (pointLogMapper != null && userId != null) {
            jdbcTemplate.update("DELETE FROM point_log WHERE user_id = ?", userId);
        }
        if (userId != null) {
            jdbcTemplate.update("DELETE FROM resource_exchange WHERE user_id = ?", userId);
        }
        if (resourceId != null) {
            jdbcTemplate.update("DELETE FROM resource WHERE id = ?", resourceId);
        }
        if (userId != null) {
            jdbcTemplate.update("DELETE FROM app_user WHERE id = ?", userId);
        }
        if (sectionId != null) {
            jdbcTemplate.update("DELETE FROM section WHERE id = ?", sectionId);
        }
    }

    /**
     * 同一唯一键并发插入时 InnoDB 可能报死锁，真实客户端会重试；重试后拿到的是 alreadyOwned。
     */
    private ExchangeResult exchangeWithDeadlockRetry() {
        for (int attempt = 0; ; attempt++) {
            try {
                return resourceService.exchange(resourceId, userId);
            } catch (ConcurrencyFailureException deadlock) {
                if (attempt >= 5) {
                    throw deadlock;
                }
                try {
                    Thread.sleep(30L * (attempt + 1));
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    throw deadlock;
                }
            }
        }
    }

    @Test
    void concurrentExchangeChargesPointsOnlyOnce() throws Exception {
        assertNotNull(userId);
        assertNotNull(resourceId);

        ExecutorService pool = Executors.newFixedThreadPool(THREADS);
        CountDownLatch ready = new CountDownLatch(THREADS);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<ExchangeResult>> futures = new ArrayList<>();

        try {
            for (int i = 0; i < THREADS; i++) {
                Callable<ExchangeResult> task = () -> {
                    ready.countDown();
                    start.await();
                    return exchangeWithDeadlockRetry();
                };
                futures.add(pool.submit(task));
            }
            assertTrue(ready.await(5, TimeUnit.SECONDS), "线程未全部就绪");
            start.countDown();

            List<ExchangeResult> results = new ArrayList<>();
            for (Future<ExchangeResult> future : futures) {
                results.add(future.get(20, TimeUnit.SECONDS));
            }

            long charged = results.stream().filter(r -> !Boolean.TRUE.equals(r.getAlreadyOwned())).count();
            long chargedWithMinusFive = results.stream()
                    .filter(r -> Integer.valueOf(-COST).equals(r.getPointsDelta()))
                    .count();
            long alreadyOwned = results.stream()
                    .filter(r -> Boolean.TRUE.equals(r.getAlreadyOwned()))
                    .count();
            ExchangeResult chargedResult = results.stream()
                    .filter(r -> !Boolean.TRUE.equals(r.getAlreadyOwned()))
                    .findFirst()
                    .orElseThrow();

            assertEquals(1, charged, "并发兑换只应有一次真正扣分");
            assertEquals(1, chargedWithMinusFive, "只有一次兑换返回 -5");
            assertEquals(THREADS - 1, alreadyOwned, "其余请求应返回 alreadyOwned");
            assertEquals(1, pointLogMapper.countBusiness(userId, "RESOURCE_EXCHANGE", chargedResult.getExchangeId()));
        } finally {
            pool.shutdownNow();
        }

        assertEquals(INITIAL_POINTS - COST,
                jdbcTemplate.queryForObject("SELECT points FROM app_user WHERE id = ?", Integer.class, userId).intValue());
        assertEquals(1, jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM resource_exchange WHERE user_id = ? AND resource_id = ?",
                Integer.class, userId, resourceId).intValue());
        assertNotNull(exchangeMapper.selectByUserAndResource(userId, resourceId));
    }
}
