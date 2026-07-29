package com.pos.crm.bootstrap;

import com.pos.crm.repository.CustomerOrderPhotoRepository;
import com.pos.crm.repository.CustomerOrderRepository;
import com.pos.crm.repository.CustomerRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.util.List;
import java.util.Map;

@Component
@Order(1)
@RequiredArgsConstructor
public class CrmDataMigrator implements ApplicationRunner {

    private final CustomerRepository customerRepository;
    private final CustomerOrderRepository customerOrderRepository;
    private final CustomerOrderPhotoRepository customerOrderPhotoRepository;
    private final DataSource dataSource;

    @Value("${app.migration.pos-core-datasource-url:}")
    private String posCoreDatasourceUrl;

    @Value("${app.migration.pos-core-datasource-username:}")
    private String posCoreUsername;

    @Value("${app.migration.pos-core-datasource-password:}")
    private String posCorePassword;

    @Override
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(posCoreDatasourceUrl)) {
            LogUtil.info(CrmDataMigrator.class, "Skipping crm data migration: POS_CORE_DATASOURCE_URL not set");
            return;
        }

        JdbcTemplate sourceJdbc = new JdbcTemplate(sourceDataSource());
        JdbcTemplate targetJdbc = new JdbcTemplate(dataSource);

        if (customerRepository.count() == 0) {
            LogUtil.info(CrmDataMigrator.class, "Migrating customers from POS core database");
            copyCustomers(sourceJdbc, targetJdbc);
        }

        if (customerOrderRepository.count() == 0) {
            LogUtil.info(CrmDataMigrator.class, "Migrating customer orders from POS core database");
            copyCustomerOrders(sourceJdbc, targetJdbc);
        }

        if (customerOrderPhotoRepository.count() == 0) {
            LogUtil.info(CrmDataMigrator.class, "Migrating customer order photos from POS core database");
            copyCustomerOrderPhotos(sourceJdbc, targetJdbc);
        }

        LogUtil.info(CrmDataMigrator.class, "Crm data migration completed");
    }

    private void copyCustomers(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT id, company_id, name, phone, email, loyalty_pts, created_at
            FROM customers
            ORDER BY created_at
            """
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO customers (id, company_id, name, phone, email, loyalty_pts, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("company_id"),
                row.get("name"),
                row.get("phone"),
                row.get("email"),
                row.get("loyalty_pts"),
                row.get("created_at")
            );
        }
        // customers.id is UUID (application-generated) — no sequence to reset, unlike
        // platform-service's SERIAL companies.id.
    }

    private void copyCustomerOrders(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT co.id, s.company_id, co.store_id, s.name AS store_name, co.external_number, co.status,
                   co.client_name, co.client_phone, co.delivery_address, co.comment,
                   co.courier_id, cu.full_name AS courier_name,
                   co.payment_method, co.receipt_number, co.receipt_at, co.total_amount,
                   co.created_by, co.created_at, co.updated_at
            FROM customer_orders co
            JOIN stores s ON s.id = co.store_id
            LEFT JOIN users cu ON cu.id = co.courier_id
            ORDER BY co.created_at
            """
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO customer_orders (
                    id, company_id, store_id, store_name, external_number, status,
                    client_name, client_phone, delivery_address, comment,
                    courier_id, courier_name,
                    payment_method, receipt_number, receipt_at, total_amount,
                    created_by, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("company_id"),
                row.get("store_id"),
                row.get("store_name"),
                row.get("external_number"),
                row.get("status"),
                row.get("client_name"),
                row.get("client_phone"),
                row.get("delivery_address"),
                row.get("comment"),
                row.get("courier_id"),
                row.get("courier_name"),
                row.get("payment_method"),
                row.get("receipt_number"),
                row.get("receipt_at"),
                row.get("total_amount"),
                row.get("created_by"),
                row.get("created_at"),
                row.get("updated_at")
            );
        }
        resetSequence(targetJdbc, "customer_orders");
    }

    private void copyCustomerOrderPhotos(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT id, order_id, slot, file_name, content_type
            FROM customer_order_photos
            ORDER BY id
            """
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO customer_order_photos (id, order_id, slot, file_name, content_type)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("order_id"),
                row.get("slot"),
                row.get("file_name"),
                row.get("content_type")
            );
        }
        resetSequence(targetJdbc, "customer_order_photos");
    }

    private void resetSequence(JdbcTemplate targetJdbc, String tableName) {
        targetJdbc.execute(
            "SELECT setval(pg_get_serial_sequence('" + tableName + "', 'id'), COALESCE((SELECT MAX(id) FROM " + tableName + "), 1))"
        );
    }

    private DataSource sourceDataSource() {
        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setDriverClassName("org.postgresql.Driver");
        ds.setUrl(posCoreDatasourceUrl);
        ds.setUsername(posCoreUsername);
        ds.setPassword(posCorePassword);
        return ds;
    }
}
