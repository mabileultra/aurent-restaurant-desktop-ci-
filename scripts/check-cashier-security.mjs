#!/usr/bin/env node
/**
 * Cashier security guardrails — ключевые ограничения в API.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const saleController = readFileSync(
  join(root, 'web-backend/src/main/java/com/pos/sales/controller/SaleController.java'),
  'utf8'
);
if (!saleController.includes("@PreAuthorize(\"hasAnyRole('CASHIER', 'WAITER', 'ADMIN', 'MANAGER')\")")) {
  errors.push('SaleController.createSale must require CASHIER/WAITER/ADMIN/MANAGER');
}

const productController = readFileSync(
  join(root, 'web-backend/src/main/java/com/pos/catalog/controller/ProductController.java'),
  'utf8'
);
if (!productController.includes("getProductLifecycle") || !productController.includes("@PreAuthorize(\"hasAnyRole('ADMIN', 'MANAGER')\")")) {
  errors.push('ProductController lifecycle must be ADMIN/MANAGER only');
}
if (!productController.includes("deleteProduct") || !productController.includes("@PreAuthorize(\"hasAnyRole('ADMIN', 'MANAGER')\")")) {
  errors.push('ProductController.deleteProduct must be ADMIN/MANAGER only');
}

const cashierSupport = readFileSync(
  join(root, 'web-backend/src/main/java/com/pos/service/support/CashierSaleSupport.java'),
  'utf8'
);
if (cashierSupport.includes('allowed.isEmpty() && cashier.getCompany()')) {
  errors.push('CashierSaleSupport must not allow any company store when cashier has no assignments');
}

if (errors.length) {
  console.error('Cashier security check failed:\n');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log('Cashier security checks passed');
