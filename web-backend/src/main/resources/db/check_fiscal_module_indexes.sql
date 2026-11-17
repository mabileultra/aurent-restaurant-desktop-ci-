-- AUR-19: проверка после деплоя. Ожидается 6 строк, у каждой is_valid = true и is_unique = true.
-- Меньше 6 строк или is_valid = false — миграция v60-fiscal-module-unique.xml не применилась.
SELECT i.relname      AS index_name,
       t.relname      AS table_name,
       x.indisunique  AS is_unique,
       x.indisvalid   AS is_valid,
       pg_get_indexdef(x.indexrelid) AS definition
  FROM pg_index x
  JOIN pg_class i ON i.oid = x.indexrelid
  JOIN pg_class t ON t.oid = x.indrelid
  JOIN pg_namespace n ON n.oid = i.relnamespace
 WHERE n.nspname = current_schema()
   AND i.relname IN (
       'uq_cash_registers_fm_fiscal_card_id',
       'uq_cr_multikassa_fm_terminal_id',
       'uq_cr_multikassa_fm_module_number',
       'uq_cr_multikassa_fm_selected_drive_id',
       'uq_cr_fiscal_drive_fm_factory_id',
       'uq_cr_fiscal_drive_fm_terminal_id'
   )
 ORDER BY i.relname;
