-- AUR-19: read-only отчёт о ФМ, привязанных к нескольким кассам.
-- Запускать на prod ДО деплоя миграции v60-fiscal-module-unique.xml.
-- Пустой результат = можно деплоить. Иначе выясните, какой кассе реально принадлежит ФМ,
-- отвяжите его у остальных касс через UI/SQL и запустите отчёт снова.
--
-- Правила те же, что в миграции и в FiscalModuleBindingGuard:
--   * ключ = LOWER(TRIM(value)), NULL и пустые строки не участвуют;
--   * конфликт = в одной группе один ключ у РАЗНЫХ касс (COUNT(DISTINCT register_id) > 1);
--   * Multikassa terminal_id и module_number — одна группа (перекрёстная проверка),
--     поэтому один серийник в обоих полях ОДНОЙ кассы конфликтом не считается;
--   * статус кассы не важен: INACTIVE-касса тоже занимает ФМ.
WITH bindings AS (
    SELECT 'CASH_REGISTER_FISCAL_CARD' AS fm_group, 'cash_registers.fiscal_card_id' AS field,
           cr.id AS register_id, cr.fiscal_card_id AS raw_value, LOWER(TRIM(cr.fiscal_card_id)) AS fm_key
      FROM cash_registers cr
     WHERE cr.fiscal_card_id IS NOT NULL AND TRIM(cr.fiscal_card_id) <> ''
    UNION ALL
    SELECT 'MULTIKASSA_FM_SERIAL', 'cash_register_multikassa_settings.terminal_id',
           mk.cash_register_id, mk.terminal_id, LOWER(TRIM(mk.terminal_id))
      FROM cash_register_multikassa_settings mk
     WHERE mk.terminal_id IS NOT NULL AND TRIM(mk.terminal_id) <> ''
    UNION ALL
    SELECT 'MULTIKASSA_FM_SERIAL', 'cash_register_multikassa_settings.module_number',
           mk.cash_register_id, mk.module_number, LOWER(TRIM(mk.module_number))
      FROM cash_register_multikassa_settings mk
     WHERE mk.module_number IS NOT NULL AND TRIM(mk.module_number) <> ''
    UNION ALL
    SELECT 'MULTIKASSA_DRIVE', 'cash_register_multikassa_settings.selected_drive_id',
           mk.cash_register_id, mk.selected_drive_id, LOWER(TRIM(mk.selected_drive_id))
      FROM cash_register_multikassa_settings mk
     WHERE mk.selected_drive_id IS NOT NULL AND TRIM(mk.selected_drive_id) <> ''
    UNION ALL
    SELECT 'FISCAL_DRIVE_FACTORY', 'cash_register_fiscal_drive_settings.factory_id',
           fd.cash_register_id, fd.factory_id, LOWER(TRIM(fd.factory_id))
      FROM cash_register_fiscal_drive_settings fd
     WHERE fd.factory_id IS NOT NULL AND TRIM(fd.factory_id) <> ''
    UNION ALL
    SELECT 'FISCAL_DRIVE_TERMINAL', 'cash_register_fiscal_drive_settings.terminal_id',
           fd.cash_register_id, fd.terminal_id, LOWER(TRIM(fd.terminal_id))
      FROM cash_register_fiscal_drive_settings fd
     WHERE fd.terminal_id IS NOT NULL AND TRIM(fd.terminal_id) <> ''
),
conflicts AS (
    SELECT fm_group, fm_key
      FROM bindings
     GROUP BY fm_group, fm_key
    HAVING COUNT(DISTINCT register_id) > 1
)
SELECT b.fm_group,
       b.fm_key,
       b.field,
       b.raw_value,
       b.register_id,
       cr.register_number,
       cr.status      AS register_status,
       s.id           AS store_id,
       s.name         AS store_name,
       s.company_id
  FROM bindings b
  JOIN conflicts c ON c.fm_group = b.fm_group AND c.fm_key = b.fm_key
  JOIN cash_registers cr ON cr.id = b.register_id
  LEFT JOIN stores s ON s.id = cr.store_id
 ORDER BY b.fm_group, b.fm_key, b.register_id, b.field;
