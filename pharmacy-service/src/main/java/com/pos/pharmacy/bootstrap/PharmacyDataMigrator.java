package com.pos.pharmacy.bootstrap;

import com.pos.pharmacy.catalog.repository.ProductRepository;
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

/**
 * One-time copy of pharmacy catalog, warehouse and sales from pos_db into pharmacy_db.
 * Runs only when {@code POS_CORE_DATASOURCE_URL} is set and target tables are empty.
 */
@Component
@Order(1)
@RequiredArgsConstructor
public class PharmacyDataMigrator implements ApplicationRunner {

    private static final String PHARMACY_STORE_FILTER = "UPPER(st.business_type) = 'PHARMACY'";

    private static final String PHARMACY_PRODUCT_FILTER = """
        p.business_type_id IN (
            SELECT bt.id FROM business_types bt WHERE UPPER(bt.code) = 'PHARMACY'
        )
        """;

    private final ProductRepository productRepository;
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
            LogUtil.info(PharmacyDataMigrator.class, "Skipping pharmacy data migration: POS_CORE_DATASOURCE_URL not set");
            return;
        }

        JdbcTemplate sourceJdbc = new JdbcTemplate(sourceDataSource());
        JdbcTemplate targetJdbc = new JdbcTemplate(dataSource);

        if (isEmpty(targetJdbc, "categories")) {
            LogUtil.info(PharmacyDataMigrator.class, "Migrating categories from POS core database");
            copyCategories(sourceJdbc, targetJdbc);
            resetSequence(targetJdbc, "categories");
        }

        if (isEmpty(targetJdbc, "suppliers")) {
            LogUtil.info(PharmacyDataMigrator.class, "Migrating suppliers from POS core database");
            copySuppliers(sourceJdbc, targetJdbc);
        }

        if (productRepository.count() == 0) {
            LogUtil.info(PharmacyDataMigrator.class, "Migrating products from POS core database");
            copyProducts(sourceJdbc, targetJdbc);
        }

        if (isEmpty(targetJdbc, "product_attributes")) {
            LogUtil.info(PharmacyDataMigrator.class, "Migrating product attributes from POS core database");
            copyProductAttributes(sourceJdbc, targetJdbc);
        }

        if (isEmpty(targetJdbc, "product_barcodes")) {
            LogUtil.info(PharmacyDataMigrator.class, "Migrating product barcodes from POS core database");
            copyProductBarcodes(sourceJdbc, targetJdbc);
        }

        if (isEmpty(targetJdbc, "store_stock")) {
            LogUtil.info(PharmacyDataMigrator.class, "Migrating store stock from POS core database");
            copyStoreStock(sourceJdbc, targetJdbc);
        }

        if (isEmpty(targetJdbc, "stock_receipts")) {
            LogUtil.info(PharmacyDataMigrator.class, "Migrating stock receipts from POS core database");
            copyStockReceipts(sourceJdbc, targetJdbc);
        }

        if (isEmpty(targetJdbc, "stock_receipt_lines")) {
            LogUtil.info(PharmacyDataMigrator.class, "Migrating stock receipt lines from POS core database");
            copyStockReceiptLines(sourceJdbc, targetJdbc);
        }

        if (isEmpty(targetJdbc, "stock_lots")) {
            LogUtil.info(PharmacyDataMigrator.class, "Migrating stock lots from POS core database");
            copyStockLots(sourceJdbc, targetJdbc);
        }

        if (isEmpty(targetJdbc, "sales")) {
            LogUtil.info(PharmacyDataMigrator.class, "Migrating sales from POS core database");
            copySales(sourceJdbc, targetJdbc);
        }

        if (isEmpty(targetJdbc, "sale_items")) {
            LogUtil.info(PharmacyDataMigrator.class, "Migrating sale items from POS core database");
            copySaleItems(sourceJdbc, targetJdbc);
        }

        if (isEmpty(targetJdbc, "sale_item_lots")) {
            LogUtil.info(PharmacyDataMigrator.class, "Migrating sale item lots from POS core database");
            copySaleItemLots(sourceJdbc, targetJdbc);
        }

        LogUtil.info(PharmacyDataMigrator.class, "Pharmacy data migration completed");
    }

    private void copyCategories(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT DISTINCT c.id, c.company_id, c.name, 100 AS sort_order, TRUE AS active
            FROM categories c
            JOIN products p ON p.category_id = c.id
            WHERE %s
            ORDER BY c.id
            """.formatted(PHARMACY_PRODUCT_FILTER)
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO categories (id, company_id, name, sort_order, active)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("company_id"),
                row.get("name"),
                row.get("sort_order"),
                row.get("active")
            );
        }
    }

    private void copySuppliers(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT DISTINCT s.id, s.company_id, s.name, s.tax_id, s.address, s.email, s.phone,
                   s.created_at, s.updated_at
            FROM suppliers s
            WHERE s.company_id IN (
                SELECT DISTINCT p.company_id
                FROM products p
                WHERE %s
            )
            ORDER BY s.created_at
            """.formatted(PHARMACY_PRODUCT_FILTER)
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO suppliers (id, company_id, name, tax_id, address, email, phone, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("company_id"),
                row.get("name"),
                row.get("tax_id"),
                row.get("address"),
                row.get("email"),
                row.get("phone"),
                row.get("created_at"),
                row.get("updated_at")
            );
        }
    }

    private void copyProducts(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT p.id, p.company_id, p.sku, p.name, p.description, p.category_id,
                   p.cost_price, p.selling_price, p.default_discount_percent, p.tax_rate,
                   p.product_type, p.sale_type, p.unit_code, p.quantity_scale, p.allow_fraction,
                   p.stock_quantity, p.low_stock_alert, p.barcode, p.plu, p.image_url, p.is_active,
                   p.external_product_id, p.ikpu, p.ikpu_status, p.unit_of_measure, p.unit_measure_code,
                   p.package_code, p.sold_individually, p.marked_product, p.storage_location,
                   p.owner_type, p.commission_tin, p.commission_pinfl, p.uz_invoice_document_id,
                   p.created_at, p.updated_at
            FROM products p
            WHERE %s
            ORDER BY p.created_at
            """.formatted(PHARMACY_PRODUCT_FILTER)
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO products (
                    id, company_id, sku, name, description, category_id,
                    cost_price, selling_price, default_discount_percent, tax_rate,
                    product_type, sale_type, unit_code, quantity_scale, allow_fraction,
                    stock_quantity, low_stock_alert, barcode, plu, image_url, is_active,
                    external_product_id, ikpu, ikpu_status, unit_of_measure, unit_measure_code,
                    package_code, sold_individually, marked_product, storage_location,
                    owner_type, commission_tin, commission_pinfl, uz_invoice_document_id,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("company_id"),
                row.get("sku"),
                row.get("name"),
                row.get("description"),
                row.get("category_id"),
                row.get("cost_price"),
                row.get("selling_price"),
                row.get("default_discount_percent"),
                row.get("tax_rate"),
                row.get("product_type"),
                row.get("sale_type"),
                row.get("unit_code"),
                row.get("quantity_scale"),
                row.get("allow_fraction"),
                row.get("stock_quantity"),
                row.get("low_stock_alert"),
                row.get("barcode"),
                row.get("plu"),
                row.get("image_url"),
                row.get("is_active"),
                row.get("external_product_id"),
                row.get("ikpu"),
                row.get("ikpu_status"),
                row.get("unit_of_measure"),
                row.get("unit_measure_code"),
                row.get("package_code"),
                row.get("sold_individually"),
                row.get("marked_product"),
                row.get("storage_location"),
                row.get("owner_type"),
                row.get("commission_tin"),
                row.get("commission_pinfl"),
                row.get("uz_invoice_document_id"),
                row.get("created_at"),
                row.get("updated_at")
            );
        }
    }

    private void copyProductAttributes(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT pa.product_id, pa.field_key, pa.value_text
            FROM product_attributes pa
            JOIN products p ON p.id = pa.product_id
            WHERE %s
            ORDER BY pa.product_id, pa.field_key
            """.formatted(PHARMACY_PRODUCT_FILTER)
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO product_attributes (product_id, field_key, value_text)
                VALUES (?, ?, ?)
                ON CONFLICT (product_id, field_key) DO NOTHING
                """,
                row.get("product_id"),
                row.get("field_key"),
                row.get("value_text")
            );
        }
    }

    private void copyProductBarcodes(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT pb.id, pb.product_id, pb.barcode
            FROM product_barcodes pb
            JOIN products p ON p.id = pb.product_id
            WHERE %s
            ORDER BY pb.id
            """.formatted(PHARMACY_PRODUCT_FILTER)
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO product_barcodes (id, product_id, barcode)
                VALUES (?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("product_id"),
                row.get("barcode")
            );
        }
    }

    private void copyStoreStock(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT ss.product_id, ss.store_id, ss.quantity
            FROM store_stock ss
            JOIN products p ON p.id = ss.product_id
            WHERE %s
            ORDER BY ss.store_id, ss.product_id
            """.formatted(PHARMACY_PRODUCT_FILTER)
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO store_stock (product_id, store_id, quantity)
                VALUES (?, ?, ?)
                ON CONFLICT (product_id, store_id) DO NOTHING
                """,
                row.get("product_id"),
                row.get("store_id"),
                row.get("quantity")
            );
        }
    }

    private void copyStockReceipts(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT sr.id, st.company_id, sr.receipt_number, sr.status, sr.document_date, sr.receipt_type,
                   sr.default_markup_percent, sr.invoice_number, sr.invoice_date, sr.contract_number,
                   sr.financial_discount, sr.payment_type, sr.supplier_id, sr.store_id, sr.notes,
                   sr.total_quantity, sr.total_cost, sr.total_retail, sr.created_by, sr.created_at,
                   sr.activated_at, sr.activated_by
            FROM stock_receipts sr
            JOIN stores st ON st.id = sr.store_id
            WHERE %s
            ORDER BY sr.created_at
            """.formatted(PHARMACY_STORE_FILTER)
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO stock_receipts (
                    id, company_id, receipt_number, status, document_date, receipt_type,
                    default_markup_percent, invoice_number, invoice_date, contract_number,
                    financial_discount, payment_type, supplier_id, store_id, notes,
                    total_quantity, total_cost, total_retail, created_by, created_at,
                    activated_at, activated_by
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("company_id"),
                row.get("receipt_number"),
                row.get("status"),
                row.get("document_date"),
                row.get("receipt_type"),
                row.get("default_markup_percent"),
                row.get("invoice_number"),
                row.get("invoice_date"),
                row.get("contract_number"),
                row.get("financial_discount"),
                row.get("payment_type"),
                row.get("supplier_id"),
                row.get("store_id"),
                row.get("notes"),
                row.get("total_quantity"),
                row.get("total_cost"),
                row.get("total_retail"),
                row.get("created_by"),
                row.get("created_at"),
                row.get("activated_at"),
                row.get("activated_by")
            );
        }
    }

    private void copyStockReceiptLines(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT srl.id, srl.receipt_id, srl.product_id, srl.quantity, srl.purchase_price,
                   srl.unit_selling_price, srl.line_cost, srl.batch_number, srl.expiry_date,
                   srl.vat_percent, srl.markup_percent, srl.units_in_pack, srl.purchase_price_with_vat,
                   srl.retail_price, srl.unit_retail_price, srl.line_retail
            FROM stock_receipt_lines srl
            JOIN stock_receipts sr ON sr.id = srl.receipt_id
            JOIN stores st ON st.id = sr.store_id
            JOIN products p ON p.id = srl.product_id
            WHERE %s AND %s
            ORDER BY srl.receipt_id, srl.id
            """.formatted(PHARMACY_STORE_FILTER, PHARMACY_PRODUCT_FILTER)
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO stock_receipt_lines (
                    id, receipt_id, product_id, quantity, purchase_price, unit_selling_price, line_cost,
                    batch_number, expiry_date, vat_percent, markup_percent, units_in_pack,
                    purchase_price_with_vat, retail_price, unit_retail_price, line_retail
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("receipt_id"),
                row.get("product_id"),
                row.get("quantity"),
                row.get("purchase_price"),
                row.get("unit_selling_price"),
                row.get("line_cost"),
                row.get("batch_number"),
                row.get("expiry_date"),
                row.get("vat_percent"),
                row.get("markup_percent"),
                row.get("units_in_pack"),
                row.get("purchase_price_with_vat"),
                row.get("retail_price"),
                row.get("unit_retail_price"),
                row.get("line_retail")
            );
        }
    }

    private void copyStockLots(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT sl.id, sl.product_id, sl.store_id, sl.receipt_line_id, sl.batch_number, sl.expiry_date,
                   sl.quantity, sl.purchase_price, sl.unit_selling_price, sl.created_at
            FROM stock_lots sl
            JOIN products p ON p.id = sl.product_id
            JOIN stores st ON st.id = sl.store_id
            WHERE %s AND %s
            ORDER BY sl.created_at
            """.formatted(PHARMACY_STORE_FILTER, PHARMACY_PRODUCT_FILTER)
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO stock_lots (
                    id, product_id, store_id, receipt_line_id, batch_number, expiry_date,
                    quantity, purchase_price, unit_selling_price, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("product_id"),
                row.get("store_id"),
                row.get("receipt_line_id"),
                row.get("batch_number"),
                row.get("expiry_date"),
                row.get("quantity"),
                row.get("purchase_price"),
                row.get("unit_selling_price"),
                row.get("created_at")
            );
        }
    }

    private void copySales(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT sa.id, COALESCE(sa.company_id, st.company_id) AS company_id, sa.receipt_number,
                   sa.cashier_id, u.full_name AS cashier_name,
                   sa.store_id, sa.cashier_shift_id, sa.subtotal, sa.tax_total, sa.discount_total,
                   sa.line_discount_total, sa.order_discount_amount, sa.order_discount_percent,
                   sa.total_amount, sa.payment_method, sa.receipt_type, sa.card_type,
                   sa.cash_amount, sa.card_amount, sa.amount_tendered, sa.change_given, sa.status,
                   sa.notes, sa.patient_pinfl, sa.loyalty_phone, sa.pharmacy_dmed,
                   sa.fiscal_status, sa.fiscal_sign, sa.fiscal_receipt_seq, sa.multikassa_sale_id,
                   sa.fiscal_qr_url, sa.fiscal_terminal_id, sa.fiscalized_at, sa.fiscal_error,
                   sa.print_fiscal_qr, sa.created_at
            FROM sales sa
            JOIN stores st ON st.id = sa.store_id
            LEFT JOIN users u ON u.id = sa.cashier_id
            WHERE %s
            ORDER BY sa.created_at
            """.formatted(PHARMACY_STORE_FILTER)
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO sales (
                    id, company_id, receipt_number, cashier_id, cashier_name, store_id, cashier_shift_id,
                    subtotal, tax_total, discount_total, line_discount_total, order_discount_amount,
                    order_discount_percent, total_amount, payment_method, receipt_type, card_type,
                    cash_amount, card_amount, amount_tendered, change_given, status, notes,
                    patient_pinfl, loyalty_phone, pharmacy_dmed, fiscal_status, fiscal_sign,
                    fiscal_receipt_seq, multikassa_sale_id, fiscal_qr_url, fiscal_terminal_id,
                    fiscalized_at, fiscal_error, print_fiscal_qr, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("company_id"),
                row.get("receipt_number"),
                row.get("cashier_id"),
                row.get("cashier_name"),
                row.get("store_id"),
                row.get("cashier_shift_id"),
                row.get("subtotal"),
                row.get("tax_total"),
                row.get("discount_total"),
                row.get("line_discount_total"),
                row.get("order_discount_amount"),
                row.get("order_discount_percent"),
                row.get("total_amount"),
                row.get("payment_method"),
                row.get("receipt_type"),
                row.get("card_type"),
                row.get("cash_amount"),
                row.get("card_amount"),
                row.get("amount_tendered"),
                row.get("change_given"),
                row.get("status"),
                row.get("notes"),
                row.get("patient_pinfl"),
                row.get("loyalty_phone"),
                row.get("pharmacy_dmed"),
                row.get("fiscal_status"),
                row.get("fiscal_sign"),
                row.get("fiscal_receipt_seq"),
                row.get("multikassa_sale_id"),
                row.get("fiscal_qr_url"),
                row.get("fiscal_terminal_id"),
                row.get("fiscalized_at"),
                row.get("fiscal_error"),
                row.get("print_fiscal_qr"),
                row.get("created_at")
            );
        }
    }

    private void copySaleItems(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT si.id, si.sale_id, si.product_id, si.product_name, si.unit_price, si.quantity,
                   si.returned_quantity, si.discount, si.tax_amount, si.line_total,
                   si.batch_number, si.expiry_date
            FROM sale_items si
            JOIN sales sa ON sa.id = si.sale_id
            JOIN stores st ON st.id = sa.store_id
            WHERE %s
            ORDER BY si.sale_id, si.id
            """.formatted(PHARMACY_STORE_FILTER)
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO sale_items (
                    id, sale_id, product_id, product_name, unit_price, quantity, returned_quantity,
                    discount, tax_amount, line_total, batch_number, expiry_date
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("sale_id"),
                row.get("product_id"),
                row.get("product_name"),
                row.get("unit_price"),
                row.get("quantity"),
                row.get("returned_quantity"),
                row.get("discount"),
                row.get("tax_amount"),
                row.get("line_total"),
                row.get("batch_number"),
                row.get("expiry_date")
            );
        }
    }

    private void copySaleItemLots(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT sil.id, sil.sale_item_id, sil.lot_id, sil.quantity, sil.batch_number, sil.expiry_date
            FROM sale_item_lots sil
            JOIN sale_items si ON si.id = sil.sale_item_id
            JOIN sales sa ON sa.id = si.sale_id
            JOIN stores st ON st.id = sa.store_id
            WHERE %s
            ORDER BY sil.sale_item_id, sil.id
            """.formatted(PHARMACY_STORE_FILTER)
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO sale_item_lots (id, sale_item_id, lot_id, quantity, batch_number, expiry_date)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("sale_item_id"),
                row.get("lot_id"),
                row.get("quantity"),
                row.get("batch_number"),
                row.get("expiry_date")
            );
        }
    }

    private boolean isEmpty(JdbcTemplate targetJdbc, String tableName) {
        Long count = targetJdbc.queryForObject("SELECT COUNT(*) FROM " + tableName, Long.class);
        return count == null || count == 0;
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
