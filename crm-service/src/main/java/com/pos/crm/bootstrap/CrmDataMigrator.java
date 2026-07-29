package com.pos.crm.bootstrap;

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

    private DataSource sourceDataSource() {
        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setDriverClassName("org.postgresql.Driver");
        ds.setUrl(posCoreDatasourceUrl);
        ds.setUsername(posCoreUsername);
        ds.setPassword(posCorePassword);
        return ds;
    }
}
