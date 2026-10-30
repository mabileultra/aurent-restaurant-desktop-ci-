# Graph Report - web-frontend  (2026-10-29)

## Corpus Check
- Large corpus: 1511 files · ~372,217 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 4588 nodes · 17426 edges · 163 communities (157 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Pharmacy Cashier & ASL
- Super Admin Platform
- API Client & Endpoints
- Product Catalog & Import
- Pharmacy Cashier & ASL
- Pharmacy Cashier & ASL
- Cash Module
- Cash Module
- Hardware & Escpos Services
- Cashier POS & Checkout
- Finance & Cash Flow
- Finance & Cash Flow
- Public Landing Pages
- App Routing & Layout
- Reports & Analytics
- Tenant Stores & Branches
- Hardware & Escpos Services
- Inventory & Stock Management
- Pharmacy Cashier & ASL
- Analytics Dashboard & Charts
- Sales Module
- Reports & Analytics
- Cashier POS & Checkout
- Utils Module
- Cashier POS & Checkout
- App Routing & Layout
- Zustand State Stores
- Tenant Stores & Branches
- Hardware & Escpos Services
- UI Base Components
- Utils Module
- Pharmacy Cashier & ASL
- Super Admin Platform
- Electronic Scales Integration
- Utils Module
- Super Admin Platform
- App Routing & Layout
- ASL Marking Verification
- Super Admin Platform
- Hardware & Escpos Services
- ASL Marking Verification
- Layout Module
- Hardware & Escpos Services
- Hardware & Escpos Services
- Layout Module
- Utils Module
- Finance & Cash Flow
- Product Catalog & Import
- Inventory & Stock Management
- Utils Module
- Utils Module
- Zustand State Stores
- ASL Marking Verification
- Layout Module
- Super Admin Platform
- Billing & Payment Ledger
- Desktop Module
- Super Admin Platform
- Utils Module
- Super Admin Platform
- Pharmacy Cashier & ASL
- Zustand State Stores
- Cashier POS & Checkout
- Utils Module
- Cashier POS & Checkout
- Cashier POS & Checkout
- ASL Marking Verification
- Hardware & Escpos Services
- Cashier POS & Checkout
- Cashier POS & Checkout
- Hardware & Escpos Services
- Pharmacy Cashier & ASL
- Cashier POS & Checkout
- Utils Module
- Orders & Fulfillment
- Pharmacy Cashier & ASL
- Utils Module
- Pharmacy Cashier & ASL
- Inventory & Stock Management
- Hardware & Escpos Services
- Cashier POS & Checkout
- Product Catalog & Import
- Utils Module
- Super Admin Platform
- Authentication & Session
- Reports & Analytics
- Tenant Stores & Branches
- Community 87
- Support Module
- Hardware & Escpos Services
- Receipt Module
- Product Catalog & Import
- Product Catalog & Import
- Product Catalog & Import
- Public Landing Pages
- Hardware & Escpos Services
- Cashier POS & Checkout
- Hardware & Escpos Services
- Cashier POS & Checkout
- Utils Module
- Pharmacy Cashier & ASL
- Community 101
- Utils Module
- Pharmacy Cashier & ASL
- Super Admin Platform
- Hardware & Escpos Services
- Cashier POS & Checkout
- Inventory & Stock Management
- Utils Module
- Pharmacy Cashier & ASL
- Super Admin Platform
- Super Admin Platform
- Utils Module
- Product Catalog & Import
- Super Admin Platform
- Tenant Stores & Branches
- App Routing & Layout
- Utils Module
- Utils Module
- Shared Components & Pagination
- Handbook Module
- Product Catalog & Import
- Hardware & Escpos Services
- Hardware & Escpos Services
- Inventory & Stock Management
- Utils Module
- Ai Module
- Super Admin Platform
- Super Admin Platform
- Product Catalog & Import
- Product Catalog & Import
- Product Catalog & Import
- Public Landing Pages
- Hardware & Escpos Services
- Utils Module
- Super Admin Platform
- Utils Module
- Community 137
- Shared Components & Pagination
- Product Catalog & Import
- Pharmacy Cashier & ASL
- Pharmacy Cashier & ASL
- Reports & Analytics
- Hardware & Escpos Services
- Utils Module
- Pharmacy Cashier & ASL
- Pharmacy Cashier & ASL
- Billing & Payment Ledger
- Product Catalog & Import
- Community 149
- Community 150
- Shared Components & Pagination
- Shared Components & Pagination
- Cashier POS & Checkout
- Product Catalog & Import
- Pharmacy Cashier & ASL
- Super Admin Platform
- Shared Components & Pagination
- Reports & Analytics
- Hardware & Escpos Services
- Community 160

## God Nodes (most connected - your core abstractions)
1. `react` - 353 edges
2. `lucide-react` - 264 edges
3. `react-i18next` - 250 edges
4. `vitest` - 170 edges
5. `@tanstack/react-query` - 150 edges
6. `BaseButton()` - 133 edges
7. `BaseSelect` - 126 edges
8. `react-hot-toast` - 124 edges
9. `fmtMoney()` - 122 edges
10. `useAuthStore` - 110 edges

## Surprising Connections (you probably didn't know these)
- `useLoginPage()` --indirect_call--> `cashierLoginPath()`  [INFERRED]
  src/features/auth/hooks/useLoginPage.js → src/utils/authLogin.js
- `PharmacyPosPage()` --indirect_call--> `updatePharmacyCartLinePrice()`  [INFERRED]
  src/features/pharmacy-cashier/pages/PharmacyPosPage.jsx → src/features/pharmacy-cashier/utils/pharmacyCartActions.js
- `usePharmacyCatalogOptions()` --indirect_call--> `productDosageForm()`  [INFERRED]
  src/features/pharmacy-stock/hooks/usePharmacyCatalogOptions.js → src/features/pharmacy-cashier/utils/pharmacyProductMeta.js
- `usePharmacyCatalogOptions()` --indirect_call--> `productManufacturer()`  [INFERRED]
  src/features/pharmacy-stock/hooks/usePharmacyCatalogOptions.js → src/features/pharmacy-stock/utils/pharmacyReceiptPricing.js
- `openCashierShift()` --calls--> `posOpenShift()`  [EXTRACTED]
  src/hooks/useCashierShift.js → src/services/pos/posDataRouter.js

## Import Cycles
- None detected.

## Communities (163 total, 6 thin omitted)

### Community 0 - "Pharmacy Cashier & ASL"
Cohesion: 0.07
Nodes (59): pharmacyWarehouseApi, BaseButton(), BaseModal(), BillingLedgerConfirmModal(), BillingLedgerDetailModal(), productCountry(), PharmacyBulkNumberModal(), PharmacyListToolbar() (+51 more)

### Community 1 - "Super Admin Platform"
Cohesion: 0.05
Nodes (53): clsx@^2.1.0, clsx, SupplierLookupSelect(), useSupplierLookupSelect(), BaseInput, SIZE_CLS, BaseSelect, optionSearchText() (+45 more)

### Community 2 - "API Client & Endpoints"
Cohesion: 0.06
Nodes (33): aiAssistantApi, aslRequestLogApi, businessConfigApi, cashRegisterConfigApi, api, companyApi, customerApi, financeSyncApi (+25 more)

### Community 3 - "Product Catalog & Import"
Cohesion: 0.06
Nodes (50): ProductImportColumnPicker(), ProductImportMarkingCell(), ProductImportPagination(), ProductImportPreviewControls(), cellAlignClass(), formatQty(), ProductImportPreviewTable(), renderCell() (+42 more)

### Community 4 - "Pharmacy Cashier & ASL"
Cohesion: 0.08
Nodes (60): PharmacyCartTable(), PharmacyExpiryCell(), formatStockExpiryDays(), PharmacyProductSearchTable, digits(), FieldRow(), lotKeyOf(), moneyInput() (+52 more)

### Community 5 - "Pharmacy Cashier & ASL"
Cohesion: 0.06
Nodes (44): PHARMACY_KEYS, POS_KEYS, readPath(), tFrom(), aslErrorText(), classifyMarkingVerifyFailure(), isAslApiKeyRejectedError(), isAslIntegrationDisabledError() (+36 more)

### Community 6 - "Cash Module"
Cohesion: 0.08
Nodes (44): lucide-react, AdminTableNoIdCells(), AdminTableNoIdHeaders(), buildPageButtons(), TABLE_PAGE_SIZE_OPTIONS, TablePagination(), CashRegisterConfigTable(), CashRegistersTable() (+36 more)

### Community 7 - "Cash Module"
Cohesion: 0.07
Nodes (42): cashRegisterApi, zReportApi, CashRegisterConfigAddModal(), CashRegisterConfigFiltersDrawer(), CashRegisterDetailsModal(), DetailRow(), fmtDateTime(), CashRegisterErrorBanner() (+34 more)

### Community 8 - "Hardware & Escpos Services"
Cohesion: 0.09
Nodes (58): fiscalDriveApi, FiscalDriveSettingsModal(), EMPTY_FORM, formFromSettings(), useFiscalDriveSettings(), ensureFiscalDriveReady(), fail(), openFiscalDriveZReport() (+50 more)

### Community 9 - "Cashier POS & Checkout"
Cohesion: 0.07
Nodes (40): PROVIDERS, PosPayFlowFooter(), PosPaymentAdvanceAmountStep(), PosPaymentCardTypeStep(), amountStr(), buildPaymentFlowState(), parseTenderedInput(), PAY_METHODS (+32 more)

### Community 10 - "Finance & Cash Flow"
Cohesion: 0.08
Nodes (42): financeApi, storeApi, ACCOUNT_TYPES, useFinanceAccountsPage(), monthStartIso(), todayIso(), useFinanceAuditPage(), useFinanceCategoriesPage() (+34 more)

### Community 11 - "Finance & Cash Flow"
Cohesion: 0.12
Nodes (32): TableRowActionsMenu(), BaseTable(), ErrorBanner(), PageLayout(), FinanceDailyChart(), FinanceKpiCard(), FinanceRecentTransactions(), FinanceDebtEntriesModal() (+24 more)

### Community 12 - "Public Landing Pages"
Cohesion: 0.09
Nodes (43): PublicAboutSection(), PublicAudienceSection(), PublicContactsInfo(), PublicContactsSection(), PublicGrowthCtaSection(), PublicControlPanelSection(), PublicEquipmentGrid(), PublicEquipmentSection() (+35 more)

### Community 13 - "App Routing & Layout"
Cohesion: 0.06
Nodes (61): pharmacyRoutes, adminRoutes, cashierRoutes, AuthRoute(), CashierPerformanceReportPage, CategorySalesReportPage, DailySummaryReportPage, DeadStockReportPage (+53 more)

### Community 14 - "Reports & Analytics"
Cohesion: 0.12
Nodes (34): date-fns, react-i18next, reportApi, ReportDateBar(), PageSearchField(), ProductSalesReportFilters(), ProductSalesReportTable(), ReportDataTable() (+26 more)

### Community 15 - "Tenant Stores & Branches"
Cohesion: 0.07
Nodes (36): companyOptionLabel(), PlatformModuleAccessCompanySelect(), PlatformModuleAccessToolbar(), PlatformCompactFilterBar(), PlatformCompanyFormModal(), PlatformCompanyStatsCards(), PlatformFilterMenu(), emptyForm() (+28 more)

### Community 16 - "Hardware & Escpos Services"
Cohesion: 0.09
Nodes (49): collectDriveArrays(), EMPTY_FORM, normalizeDrivesList(), pickDriveTerminal(), useMultikassaSettings(), resolveReceivedCashCard(), buildCloseShiftBody(), buildItem() (+41 more)

### Community 17 - "Inventory & Stock Management"
Cohesion: 0.09
Nodes (32): @hookform/resolvers, react-hook-form, react-hot-toast, zod, productApi, warehouseApi, emptyDefaults, ProductBulkDeleteModal() (+24 more)

### Community 18 - "Pharmacy Cashier & ASL"
Cohesion: 0.10
Nodes (41): PosOrderPanelLine(), PosOrderPanelTotalsFoot(), parkedTotal(), PosParkedCartsBar(), PosOrderPanel(), usePosOrderPanel(), parkedTotal(), buildPharmacySaleExtras() (+33 more)

### Community 19 - "Analytics Dashboard & Charts"
Cohesion: 0.08
Nodes (37): recharts, DashboardChartsRow(), DashboardDateRangePicker(), DashboardHero(), DashboardKpiGrid(), DashboardStatCard(), TILE, DASHBOARD_CHART_ACCENT (+29 more)

### Community 20 - "Sales Module"
Cohesion: 0.10
Nodes (34): parseLookupError(), paymentLabel(), PosReturnModal(), SalePartialReturnModal(), buildReturnPayload(), getReturnableLines(), returnableQty(), SaleReturnLinesEditor() (+26 more)

### Community 21 - "Reports & Analytics"
Cohesion: 0.18
Nodes (27): react, @tanstack/react-query, stockReportApi, DEAD_STOCK_DAYS_DEFAULT, REPORT_PAGE_SIZE_COMPACT, REPORT_PAGE_SIZE_DEFAULT, REPORT_PAGE_SIZE_OPTIONS, REPORT_PAGE_SIZE_WIDE (+19 more)

### Community 22 - "Cashier POS & Checkout"
Cohesion: 0.09
Nodes (32): fmtAt(), moneyNum(), MoneyRow(), Row(), ZReportReceiptBody(), AutoFitText(), appendKeypadDigit(), formatKeypadAmount() (+24 more)

### Community 23 - "Utils Module"
Cohesion: 0.10
Nodes (38): canAddProductFromSearchList(), isPosProductsSearchStale(), useWeightEntryModal(), displayQtyValue(), parseDecimalInput(), usePharmacyCartHandlers(), focusEl(), focusPharmacyScanField() (+30 more)

### Community 24 - "Cashier POS & Checkout"
Cohesion: 0.12
Nodes (28): cashierTerminalApi, CashierDesktopMenuFiscalDrive(), FiscalDriveSettingsModal, CashierDesktopMenuMultikassa(), MultikassaSettingsModal, FiscalDriveCashierControls(), FiscalDriveSettingsModal, MultikassaCashierControls() (+20 more)

### Community 25 - "App Routing & Layout"
Cohesion: 0.05
Nodes (47): dependencies, axios@^1.6.2, bootstrap@^5.3.3, date-fns@^3.1.0, @hookform/resolvers@^3.3.3, i18next@^26.0.10, i18next-browser-languagedetector@^8.2.1, jsbarcode@^3.12.3 (+39 more)

### Community 26 - "Zustand State Stores"
Cohesion: 0.10
Nodes (36): tenantDisplayApi, APP_NAME, LogoUploadField(), ReceiptLogoSizeControl(), ReceiptPrinterSettingsPanel(), SettingsFieldToggles(), TenantSettingsSaveBar(), UserBrandingSettingsPanel() (+28 more)

### Community 27 - "Tenant Stores & Branches"
Cohesion: 0.14
Nodes (29): TABLE_PAGE_SIZE_OPTIONS_EXTENDED, Spinner(), SupplierModal(), PlatformCompaniesTable(), PlatformCompanyQuickDrawer(), getBusinessTypeBadgeClass(), getCompanyBranchMeta(), getCompanyInitials() (+21 more)

### Community 28 - "Hardware & Escpos Services"
Cohesion: 0.10
Nodes (33): buildFiscalDriveItem(), commissionInfo(), digitsOnly(), inclusiveVatTiyin(), lineLabels(), lineVatPercent(), buildFiscalDriveReceipt(), resolveLocation() (+25 more)

### Community 29 - "UI Base Components"
Cohesion: 0.07
Nodes (13): react-dom, vitest, SectionErrorBoundary, SIZE_CLS, VARIANT_CLS, PlatformErrorState(), AurentBrandEmblem(), SIZE_CONFIG (+5 more)

### Community 30 - "Utils Module"
Cohesion: 0.10
Nodes (31): CashierPinLoginCompanyPopover(), CashierPinLoginHeader(), CashierPinLoginKeypad(), CashierPinLoginVisual(), resolvePinHomePath(), useCashierPinLoginPage(), CashierPinLoginPage(), normalizePin() (+23 more)

### Community 31 - "Pharmacy Cashier & ASL"
Cohesion: 0.11
Nodes (38): parseIso(), PharmacyExpiryCalendar(), startOfGrid(), toIso(), WEEKDAYS_RU, WEEKDAYS_UZ, ExpirySmartInput(), formatLineMoney() (+30 more)

### Community 32 - "Super Admin Platform"
Cohesion: 0.13
Nodes (30): BillingActionableLedger(), BillingCalendarDailyPanel(), BillingCalendarGrid(), BillingCalendarKpis(), BillingCalendarListView(), BillingCalendarToolbar(), buildMonthGrid(), computeCalendarKpis() (+22 more)

### Community 33 - "Electronic Scales Integration"
Cohesion: 0.13
Nodes (32): generatePharmacyBarcode(), ScalesConnectionBar(), ScalesPluSyncPanel(), useScalesPluPage(), mapFamilyToAdapter(), useScalesPluSync(), useScalesStation(), ScalesPluPage() (+24 more)

### Community 34 - "Utils Module"
Cohesion: 0.11
Nodes (31): AuthSessionGuard(), isPharmacyErrorCode(), ACTIVITY_EVENTS, AUTH_IDLE_MS, clearLastActivity(), hasLiveSession(), readLastActivity(), resetAuthIdleMarker() (+23 more)

### Community 35 - "Super Admin Platform"
Cohesion: 0.10
Nodes (34): platformModuleAccessApi, MODULE_ACCESS_GROUP_ORDER, MODULE_ACCESS_NEW_USER_MAX_AGE_MS, MODULE_ACCESS_PLATFORM_FILTER, MODULE_ACCESS_USER_FILTER_LABELS, MODULE_ACCESS_USER_FILTERS, usePlatformModuleAccessPage(), filterModulesForBusinessType() (+26 more)

### Community 36 - "App Routing & Layout"
Cohesion: 0.13
Nodes (25): NAV_ICONS, SuperAdminLayout(), canOpenPlatformPath(), firstPlatformPath(), isPlatformStaffNavRole(), PLATFORM_NAV, PLATFORM_NAV_GROUPS, visiblePlatformNav() (+17 more)

### Community 37 - "ASL Marking Verification"
Cohesion: 0.12
Nodes (26): classifyPosScanInput(), attachMarkToProduct(), lineMarkingCodes(), product, inspectMarkCirculation(), product, validateFiscalMarking, WITHDRAWN_CODES (+18 more)

### Community 38 - "Super Admin Platform"
Cohesion: 0.11
Nodes (25): BillingBulkModal(), avatarClass(), badgeClass(), BillingCompanyDrawer(), LEDGER_ICON, LedgerTimeline(), BillingCompanyManage(), BillingDeferralBlock() (+17 more)

### Community 39 - "Hardware & Escpos Services"
Cohesion: 0.14
Nodes (33): multikassaApi, loadMultikassaCapabilities(), saleFromMultikassaRaw(), applyQrHints(), coerceQrUrl(), collectNodes(), deepPick(), deepPickQr() (+25 more)

### Community 40 - "ASL Marking Verification"
Cohesion: 0.14
Nodes (25): hasSoldMarker(), isAslMarkAlreadySold(), OPEN_STATUSES, SOLD_MARKERS, truthy(), isMarkingCode(), markingScanKey(), normalizeMarkingCode() (+17 more)

### Community 41 - "Layout Module"
Cohesion: 0.12
Nodes (19): CashierPosTopbar(), CashierPosTopbarCashier(), initialsFromName(), CashierSecondaryTopbar(), CashierTopbarTerminalMeta(), CashierLayout(), CashierLayoutShell(), CashierShiftModalContext (+11 more)

### Community 42 - "Hardware & Escpos Services"
Cohesion: 0.19
Nodes (30): usePosCheckout(), buildOfflineShiftSoldItems(), round2(), isDesktopOfflineBridge(), offlineCloseShift(), offlineCompleteCheckout(), offlineDecreaseStock(), offlineGetCurrentShift() (+22 more)

### Community 43 - "Hardware & Escpos Services"
Cohesion: 0.10
Nodes (22): markingValidationApi, multikassaFiscalProvider, assertOnkmMarking(), validateFiscalMarking, expandMarkedFiscalItems(), MARKING_VALIDATION_STATUS, validateFiscalMarking(), buildRefundBody() (+14 more)

### Community 44 - "Layout Module"
Cohesion: 0.12
Nodes (27): AppShellLayout(), AppSidebar(), FINANCE_CHILDREN, FINANCE_ROUTES, GOODS_CHILDREN, GOODS_ROUTES, goodsChildrenForBusinessType(), ICONS (+19 more)

### Community 45 - "Utils Module"
Cohesion: 0.13
Nodes (24): displayCashierName(), formatShiftOpenedAt(), useCashierLayoutShell(), CashierLockContext, CashierLockProvider(), dsn, initSentry(), CASHIER_PAINT (+16 more)

### Community 46 - "Finance & Cash Flow"
Cohesion: 0.19
Nodes (20): FinanceAuditDetailModal(), formatDateTime(), FinanceChartDayDetailModal(), FinanceRecentDetailModal(), FinanceDebtEntryDetailModal(), REFERENCE_LABELS, FinanceDetailActions(), FinanceDetailDocumentLines() (+12 more)

### Community 47 - "Product Catalog & Import"
Cohesion: 0.12
Nodes (18): categoryApi, ProductsSearchField(), ProductsToolbar(), buildAttributeFiltersParam(), canManageCatalog(), PRODUCT_DEFAULT_FILTERS, PRODUCT_TABLE_PAGE_SIZE_DEFAULT, PRODUCT_TABLE_PAGE_SIZE_OPTIONS (+10 more)

### Community 48 - "Inventory & Stock Management"
Cohesion: 0.13
Nodes (17): AdminDocumentButton(), AdminDocumentFooter(), AdminDocumentHeader(), AdminDocumentKpiCard(), AdminDocumentMetaField(), AdminDocumentTopbar(), matchPct(), StockInventoryKpis() (+9 more)

### Community 49 - "Utils Module"
Cohesion: 0.16
Nodes (19): WrongAppScreen(), resolvePostLoginPath(), useLoginPage(), AuthAcceptPage(), MainWorldGate(), resetConnectivityStabilizer(), resolveAuthErrorMessage(), isPharmacyWorldBusiness() (+11 more)

### Community 50 - "Utils Module"
Cohesion: 0.16
Nodes (23): buildCashierEscposPayload(), buildEscposLabels(), readBranding(), readReceiptFields(), FISCAL_SALE, assertQrRenders(), MULTIKASSA_AGENT_RESPONSE, REGOS_RECEIPT_SALE_RESPONSE (+15 more)

### Community 51 - "Zustand State Stores"
Cohesion: 0.12
Nodes (23): desktopCtx, emptyCatalog, storeA, storeB, scheduleConnectivityRefreshFromApi(), DesktopApiBootstrap(), buildConnectivityContext(), canFallbackToOfflineCheckout() (+15 more)

### Community 52 - "ASL Marking Verification"
Cohesion: 0.17
Nodes (21): pharmacyIntegrationApi, pharmacySalesApi, pharmacyStockMarksApi, saleApi, product, validateFiscalMarking, assertCartMarksNotPunched(), inspectMarkPunched() (+13 more)

### Community 53 - "Layout Module"
Cohesion: 0.21
Nodes (19): react-router-dom, bottomNavLinkClass(), CashierBottomNav(), navClass(), readIsDesktopApp(), CashierBottomNavAside(), CashierBottomNavProducts(), CashierBottomNavRegister() (+11 more)

### Community 54 - "Super Admin Platform"
Cohesion: 0.10
Nodes (19): platformBillingApi, tenantBillingApi, BillingFiltersBar(), BillingMethodsBreakdown(), METHOD_TONE, PERIODS, BillingReportsKpis(), BillingReportsView() (+11 more)

### Community 55 - "Billing & Payment Ledger"
Cohesion: 0.15
Nodes (20): ReceiptQrCode(), BillingLedgerSection(), BillingPaymentsList(), BillingPayModal(), METHODS, ONLINE, daysLeft(), EMPTY_CARD (+12 more)

### Community 56 - "Desktop Module"
Cohesion: 0.14
Nodes (19): DesktopInstallerFirstRunGuide(), DesktopInstallerHero(), DesktopProductCard(), InstallerDownloadButton(), useDesktopInstallerPage(), useManifestQuery(), DesktopInstallerPage(), formatInstallerBytes() (+11 more)

### Community 57 - "Super Admin Platform"
Cohesion: 0.18
Nodes (20): DatePair(), Field(), RangePair(), TaxAnalyticsFiltersPanel(), PlatformDatePicker(), PlatformDateRangePicker(), Delta(), fmtMoney() (+12 more)

### Community 58 - "Utils Module"
Cohesion: 0.10
Nodes (23): authApi, useCashierLock(), CashierLockOverlay(), normalizePin(), CASHIER_COMPACT_MEDIA, CASHIER_LAYOUT_MIN_WIDTH, CASHIER_POS_DESKTOP_MEDIA, CASHIER_POS_DESKTOP_MIN_WIDTH (+15 more)

### Community 59 - "Super Admin Platform"
Cohesion: 0.16
Nodes (19): LevelBadge(), PlatformMonitoringLogRow(), PlatformMonitoringLogsTab(), PlatformMonitoringMetricsTab(), OpsCard(), PlatformMonitoringOpsStrip(), PlatformMonitoringOverviewTab(), PlatformMonitoringStatCard() (+11 more)

### Community 60 - "Pharmacy Cashier & ASL"
Cohesion: 0.13
Nodes (13): PosRegisterWorkspace(), PosOrderDiscountModal(), PRESET_PERCENTS, CashierRegisterShell(), WeightEntryModal(), usePayFlowTransition(), PosPage(), PharmacyCartPaneHead() (+5 more)

### Community 61 - "Zustand State Stores"
Cohesion: 0.15
Nodes (15): AppTopHeader(), AdminThemeSync(), LANGS, LanguageSwitcher(), OnScreenKeyboardButton(), THEMES, ThemeToggle(), ADMIN_THEME_STORAGE_KEY (+7 more)

### Community 62 - "Cashier POS & Checkout"
Cohesion: 0.16
Nodes (19): OfflineSyncProgressBanner(), resolveOfflineDockBadge(), base, sameDockBadge(), useOfflineDockBadge(), formatCatalogSyncAt(), invalidatePosData(), useOfflineStatus() (+11 more)

### Community 63 - "Utils Module"
Cohesion: 0.17
Nodes (20): RECEIPT_PRINT_DOM, RECEIPT_PRINT_ENGINE, RECEIPT_PRINT_THRESHOLDS, buildReturnReceiptSale(), prepareDesktopForPrint(), printBrowserTestReceipt(), printReceipt(), printThermalReceipt() (+12 more)

### Community 64 - "Cashier POS & Checkout"
Cohesion: 0.16
Nodes (17): CashierMySalesReturnModal(), CashierMySalesToolbar(), CashierMySalesWorkspace(), CASHIER_SALES_EMPTY_FILTERS, CASHIER_SALES_PAGE_SIZE, CASHIER_SALES_RECEIPT_DEBOUNCE_MS, CASHIER_SALES_VIEW_STORAGE_KEY, readCashierSalesViewMode() (+9 more)

### Community 65 - "Cashier POS & Checkout"
Cohesion: 0.14
Nodes (19): PHARMACY_CATALOG_PREFETCH_PAGES, PHARMACY_POS_PRODUCT_PAGE_SIZE, POS_CATALOG_PREFETCH_PAGES, POS_CATALOG_VIEW_MODE_KEY, POS_PRODUCT_PAGE_SIZE, posCatalogPageSize(), posCatalogPrefetchPages(), readPosCatalogViewMode() (+11 more)

### Community 66 - "ASL Marking Verification"
Cohesion: 0.20
Nodes (21): digitsOnly(), findByIkpu(), findByTasnif(), findInList(), firstCatalogHit(), lookupProductByMarkingGtin(), lookupTasnifForMark(), lookupTasnifIdentity() (+13 more)

### Community 67 - "Hardware & Escpos Services"
Cohesion: 0.23
Nodes (15): ThermalReportPrintPortal(), CASHIER_ESCPOS_IPC, CASHIER_ESCPOS_TOAST, CashierSalesReceiptPane(), useCashierDesktopMenu(), useReceiptPage(), buildEscposTestSale(), printFiscalReceipt() (+7 more)

### Community 68 - "Cashier POS & Checkout"
Cohesion: 0.15
Nodes (19): CashierZoomControls(), CashierDesktopMenuConnectivity(), currentScale, getSnapshot(), listeners, persistScale(), readStoredScale(), setScale() (+11 more)

### Community 69 - "Cashier POS & Checkout"
Cohesion: 0.14
Nodes (16): buildPharmacyShiftPrintReport, buildShiftPrintReport(), buildShiftItemsReceiptLines(), escapeHtml(), fmtQty(), padRow(), printDesktop(), printShiftItemsReceipt() (+8 more)

### Community 70 - "Hardware & Escpos Services"
Cohesion: 0.25
Nodes (19): resolveSyncApi(), useOfflineConnectivity(), logCatalog(), canRunOnlineSync(), isCatalogStoreMismatch(), offlineGetStatus(), CATALOG_MAX_AGE_MS, CATALOG_STALE_CHECK_MS (+11 more)

### Community 71 - "Pharmacy Cashier & ASL"
Cohesion: 0.18
Nodes (14): useCashierShiftModal(), usePosNavigation(), usePosSearchMarkAutoSubmit(), usePosPage(), usePharmacyBarcodeCacheWarm(), usePharmacyFefoEnrichment(), usePharmacyHotkeys(), usePharmacyIntegrationConfig() (+6 more)

### Community 72 - "Cashier POS & Checkout"
Cohesion: 0.20
Nodes (13): PosCatalogCategoryBrowse(), PosCatalogProductBrowse(), CHIP_ICONS, PosCatalogQuickFilters(), renderPosCatalogProduct(), PosCatalogViewToggle(), PosRegisterFinder, looksLikeRegisterScanInput() (+5 more)

### Community 73 - "Utils Module"
Cohesion: 0.18
Nodes (15): PlatformModuleAccessUserRow(), MODULE_ACCESS_USERS_PAGE_SIZE, PlatformModuleAccessUsersList(), RestaurantAuthGuard(), SuperAdminRoute(), resolveHasModule(), MODULE_DEFS, hasGrantedPlatformModule() (+7 more)

### Community 74 - "Orders & Fulfillment"
Cohesion: 0.17
Nodes (13): OrderAddWizard(), OrdersFiltersDrawer(), OrdersListHeader(), OrdersModals(), OrdersSearchPanel(), OrderAddWizardDetails(), OrderAddWizardModal(), OrderAddWizardSelectStore() (+5 more)

### Community 75 - "Pharmacy Cashier & ASL"
Cohesion: 0.17
Nodes (12): PharmacyIntegrationIcon(), PharmacyIntegrationMoreMenu(), PharmacyPayPatientCards(), PharmacySearchStrip(), STRIP_TOGGLES, PHARMACY_INTEGRATION_ICONS, PHARMACY_EXTERNAL_URLS, PHARMACY_MORE_LINKS (+4 more)

### Community 76 - "Utils Module"
Cohesion: 0.20
Nodes (16): pickRows(), resolveTarget(), ROWS, ROWS_LATIN, VirtualKeyboardOverlay(), useVirtualKeyboardStore, ensureProbeInput(), showOnScreenKeyboard() (+8 more)

### Community 77 - "Pharmacy Cashier & ASL"
Cohesion: 0.24
Nodes (13): isCompleteMarkingScan(), usePharmacySearchMarkAutoSubmit(), PharmacyReceiptMarkScanModal(), usePharmacyReceiptMarks(), usePharmacyReceiptMarkScan(), lineAsProduct(), matchReceiptLineByMarking(), stillNeedsMark() (+5 more)

### Community 78 - "Inventory & Stock Management"
Cohesion: 0.20
Nodes (13): StockDocumentNotesField(), StockDocumentPageHeader(), StockDocumentStoreSelect(), StockDocumentSubmitButton(), VARIANT_CLS, StockInventoryMetaPanel(), StockReceiptMetaPanel(), StockTransferStoresPanel() (+5 more)

### Community 79 - "Hardware & Escpos Services"
Cohesion: 0.25
Nodes (15): buildTsplLabelPayload(), buildLabelPrintJob(), DEFAULT_LABEL_LAYOUT, DEFAULT_PRESET_ID, effectiveLabelFontScale(), getLabelPresetById(), LABEL_PRINTER_STANDARD_MAX_WIDTH_MM, LABEL_SIZE_CATEGORIES (+7 more)

### Community 80 - "Cashier POS & Checkout"
Cohesion: 0.23
Nodes (13): CashierSalesCardsList(), cardPaymentLabel(), cashierSalesPaymentLabel(), cashierSalesPaymentPillClass(), CashierSalesStatusBadge(), isDeferredReceiptType(), CashierSalesListCard(), CashierSalesPagination() (+5 more)

### Community 81 - "Product Catalog & Import"
Cohesion: 0.20
Nodes (13): fieldName(), ProductCatalogDynamicFieldsSection(), useProductCatalogForm(), buildFallbackProductSku(), planCatalogStockDeltas(), roundQty(), attributeFormValue(), defaultProductCatalogFormValues (+5 more)

### Community 82 - "Utils Module"
Cohesion: 0.22
Nodes (17): findLabelPresetByLayout(), isWidePrinterPreset(), clampNum(), DEFAULTS, isTsplApiAvailable(), LabelTsplSettingsPanel(), sourceLabel(), CopiesStepper() (+9 more)

### Community 83 - "Super Admin Platform"
Cohesion: 0.18
Nodes (13): geoApi, taxAnalyticsApi, PlatformSelect, applyClientRowFilters(), emptyDraft(), exportRowsCsv(), hasClientOnlyFilters(), numOrNull() (+5 more)

### Community 84 - "Authentication & Session"
Cohesion: 0.23
Nodes (10): BrandMark(), BRAND_LOGO_FULL, BRAND_LOGO_ICON, BRAND_LOGO_SIZES, BRAND_NAME, LoginBranding(), LoginForm(), LoginPage() (+2 more)

### Community 85 - "Reports & Analytics"
Cohesion: 0.19
Nodes (13): StockDashboardChart(), StockDashboardFilters(), StockDashboardKpiGrid(), LINKS, StockDashboardQuickLinks(), StockDashboardPage(), buildStockDashboardCards(), buildStockDashboardChartData() (+5 more)

### Community 86 - "Tenant Stores & Branches"
Cohesion: 0.23
Nodes (14): BARCODE_PRINT_CATALOG_SEARCH_SIZE, useUsersBarcodePrintPage(), loadCatalogProductDetails(), clearInputElement(), fieldLooksLikeScan(), isRefTarget(), isTypingTarget(), resolveScanCode() (+6 more)

### Community 87 - "Community 87"
Cohesion: 0.21
Nodes (18): parseMm(), prepareSingleLabelPrintPage(), removeSingleLabelPrintPageLock(), SINGLE_LABEL_LOCK_STYLE_ID, assertLabelLayerReady(), barcodeSvgsReady(), cleanupLabelPrintState(), ELECTRON_SILENT_LABEL_CLASS (+10 more)

### Community 88 - "Support Module"
Cohesion: 0.18
Nodes (11): supportApi, isSupportConfigured(), supportPhone, supportPhoneHref(), supportTelegramBot, supportTelegramUrl(), normalizeBot(), phoneHrefFrom() (+3 more)

### Community 89 - "Hardware & Escpos Services"
Cohesion: 0.27
Nodes (16): tasnifApi, enrichFiscalPackageCodes(), enrichLinePackage(), isPiecePackage(), isRealFiscalPackageCode(), lineMeasureKind(), mentionsUnit(), packageCount() (+8 more)

### Community 90 - "Receipt Module"
Cohesion: 0.21
Nodes (14): FiscalReceiptBody(), itemUnitPrice(), lineVatAmount(), lineVatRatePercent(), PAYMENT_I18N, ReceiptDivider(), Row(), ThermalPrintSettingsPanel() (+6 more)

### Community 91 - "Product Catalog & Import"
Cohesion: 0.20
Nodes (14): applyBusinessConfigDefaults(), businessTypeLabelKey(), CATALOG_PROFILE_RESTAURANT_INGREDIENT, defaultProductTypeForBusinessType(), isUniversalBusinessType(), normalizeBusinessTypeCode(), resolveBusinessTypeForTemplates(), resolveCatalogSectionVisible() (+6 more)

### Community 92 - "Product Catalog & Import"
Cohesion: 0.27
Nodes (12): FieldSlot(), ProductCatalogAccountingSection(), visibleCount(), ProductCatalogBarcodesSection(), ProductCatalogFiscalSection(), inputCls, OWNER_TYPES, ProductCatalogField() (+4 more)

### Community 93 - "Product Catalog & Import"
Cohesion: 0.24
Nodes (12): ProductDeleteConfirmModal(), ProductRowActionsMenu(), LazyModalSuspense(), ProductCatalogModal, ProductsCatalogModals(), ProductExportModal, ProductImportModal, ProductsImportExportModals() (+4 more)

### Community 94 - "Public Landing Pages"
Cohesion: 0.19
Nodes (11): PublicHeroDevices(), PublicHeroSupport(), PlatformIcon(), PublicDownloadStrip(), PUBLIC_DOWNLOAD_PLATFORMS, PUBLIC_LEAD_SOURCES, PUBLIC_LEAD_TYPES, PUBLIC_SITE_NAV (+3 more)

### Community 95 - "Hardware & Escpos Services"
Cohesion: 0.38
Nodes (13): buildEscposLabelPayload(), ensureDesktopLabelPrinter(), isDesktopLabelPrintEnvironment(), readLabelPrinterName(), isCashierEscposLabelPrintAvailable(), printLabelEscpos(), isLabelTsplEnabled(), isLabelTsplPrintAvailable() (+5 more)

### Community 96 - "Cashier POS & Checkout"
Cohesion: 0.27
Nodes (14): cashierShiftApi, CashierShiftModal(), resolveActiveShiftForModalAction(), resolveShiftModalSession(), closeCashierShift(), fetchCurrentCashierShift(), openCashierShift(), shiftQueryKey() (+6 more)

### Community 97 - "Hardware & Escpos Services"
Cohesion: 0.31
Nodes (10): fiscalApi, loadFiscalContext(), resolvePendingFiscalProvider(), wrapFiscalError(), DEFAULT_FISCAL_PROVIDER, FISCAL_PROVIDER, loadFiscalCapabilities(), PROVIDERS (+2 more)

### Community 98 - "Cashier POS & Checkout"
Cohesion: 0.24
Nodes (12): usePosCartHandlers(), findProductBarcode(), normalize(), productBarcodeList(), product, withScannedBarcode(), findByGtinCandidates(), resolvePosMarkedProduct() (+4 more)

### Community 99 - "Utils Module"
Cohesion: 0.24
Nodes (12): applyLabelPrintCssVars(), cancelScheduledLabelPrintUnmount(), getLabelPrintMountEl(), scheduleLabelPrintUnmount(), teardownLabelPrintMount(), mountLabelPrintLayer(), layoutFromJob(), printShelfLabel() (+4 more)

### Community 100 - "Pharmacy Cashier & ASL"
Cohesion: 0.25
Nodes (11): clearPharmacyBarcodeCache(), entries, getCachedPharmacyProduct(), normalizeKey(), pharmacyBarcodeCacheSize(), setCachedPharmacyProduct(), warmPharmacyBarcodeCache(), loadProductById() (+3 more)

### Community 101 - "Community 101"
Cohesion: 0.12
Nodes (10): aside, assert, bridge, fs, menu, path, root, start (+2 more)

### Community 102 - "Utils Module"
Cohesion: 0.23
Nodes (8): i18next, ObservabilityErrorBoundary, applyServerValidationErrors(), buildErrorReferenceCode(), extractFieldErrors(), formatApiErrorMessage(), parseApiError(), isApiNetworkError()

### Community 103 - "Pharmacy Cashier & ASL"
Cohesion: 0.32
Nodes (9): companyBusinessTypeApi, CashierRouteLoading(), PharmacyStockReceiptRedirect(), PharmacyTenantGuard(), EMPTY, useCompanyBusinessType(), isPharmacyBusinessType(), isPharmStockPath() (+1 more)

### Community 104 - "Super Admin Platform"
Cohesion: 0.21
Nodes (10): mergeFormFieldsState(), usePlatformBusinessTypesPage(), PLATFORM_MONITORING_REFRESH_MS, BUSINESS_TYPE_FIELD_TYPES, EMPTY_BUSINESS_FIELD_FORM, EMPTY_BUSINESS_TYPE_FORM, fieldToForm(), optionsToText() (+2 more)

### Community 105 - "Hardware & Escpos Services"
Cohesion: 0.23
Nodes (14): canLog(), CATEGORIES, logActivity(), logApi(), logAuth(), logConnectivity(), logError(), logFiscal() (+6 more)

### Community 106 - "Cashier POS & Checkout"
Cohesion: 0.28
Nodes (10): cashierDesktopNotificationsApi, loadLocalReadSet(), mapServerItem(), saveLocalReadSet(), useCashierNotifications(), classifyUpdaterError(), isBenignUpdaterMessage(), mapDesktopUpdateEvent() (+2 more)

### Community 107 - "Inventory & Stock Management"
Cohesion: 0.30
Nodes (8): formatProductMeta(), ProductLookupSelect(), useProductLookupSelect(), StockDocumentAddLineButton(), StockDocumentLinesTable(), StockInventoryLinesEditor(), StockReceiptLinesEditor(), StockTransferLinesEditor()

### Community 108 - "Utils Module"
Cohesion: 0.27
Nodes (10): UnitConversionHelper(), WeightEntryModalBody(), getProductAttribute(), getProductLengthM(), convertUnitQuantity(), getUnitConversions(), coilLengthToMeters(), conversionsIntoStockUnit() (+2 more)

### Community 109 - "Pharmacy Cashier & ASL"
Cohesion: 0.26
Nodes (9): PharmacyMarkStatusBadge(), startOfLocalDayIso(), usePharmacyAslWithdrawMonitorPage(), attentionLabel(), formatWhen(), PharmacyAslWithdrawMonitorPage(), shortMark(), stockMarkAttentionKind() (+1 more)

### Community 110 - "Super Admin Platform"
Cohesion: 0.27
Nodes (9): PlatformEmailBroadcastForm(), PlatformEmailPreviewPanel(), PlatformEmailRecipientsList(), usePlatformEmailPage(), PlatformEmailPage(), EMAIL_BROADCAST_TYPE, templateLabel(), userDisplayName() (+1 more)

### Community 111 - "Super Admin Platform"
Cohesion: 0.29
Nodes (10): BULK_SKIP_STATES, useBillingCollectionActions(), buildCollectionsCsv(), csvCell(), downloadCollectionsCsv(), buildReminderText(), copyText(), normalizePhone() (+2 more)

### Community 112 - "Utils Module"
Cohesion: 0.30
Nodes (13): findLabelPresetBySize(), LABEL_PRINT_SETTINGS_KEY, constrainLabelPads(), getSafePadMaxMm(), LEGACY_LABEL_PRINT_SETTINGS_KEYS, loadSavedLabelLayout(), mergeLabelLayout(), normalizeSavedLayout() (+5 more)

### Community 113 - "Product Catalog & Import"
Cohesion: 0.27
Nodes (9): productBusinessTypeLabel(), ProductInfoAttributesCard(), ProductInfoDetailsBody(), ProductInfoIdentifiersCard(), ProductInfoModalDetailsTab(), productInfoBoolLabel(), productInfoLabelCls, productInfoRowCls (+1 more)

### Community 114 - "Super Admin Platform"
Cohesion: 0.25
Nodes (7): PlatformModuleAccessUsersPanel(), PlatformModuleAccessWorkspace(), PlatformModuleAccessUsersBulkFooter(), PlatformModuleAccessUsersFilterChips(), PlatformModuleAccessUsersPanelHeader(), PlatformModuleAccessPage(), PlatformModuleAccessPage

### Community 115 - "Tenant Stores & Branches"
Cohesion: 0.26
Nodes (8): BarcodePrintCurrentItemSection(), barcodePrintInputCls, BarcodePrintPageHeader(), BarcodePrintSearchSection(), UsersBarcodePrintPage(), UsersBarcodePrintPageContent(), buildCatalogResultMeta(), UsersBarcodePrintPage

### Community 116 - "App Routing & Layout"
Cohesion: 0.30
Nodes (7): useCashierStoreTypeQuery(), PharmacyPosGuard(), CashierHomeRedirect(), CashierRetailPosGuard(), CashierSpaNavigate(), CashierMySalesPage, PosPage

### Community 117 - "Utils Module"
Cohesion: 0.15
Nodes (12): conversionsList, FALLBACK_CONFIG, getStockUnits(), LABEL_TO_CODE, MEASURED_UNIT_CODES, PIECE_CATEGORIES, receiptUnitsList, stockUnitsForSaleType() (+4 more)

### Community 118 - "Utils Module"
Cohesion: 0.28
Nodes (9): zustand@^4.4.7, zustand, clamp(), PRINT_SETTINGS_DEFAULTS, usePrintSettingsStore, syncPrintCssVars(), applyPrintSettingsFromPayload(), isPrintDirtySuppressed() (+1 more)

### Community 119 - "Shared Components & Pagination"
Cohesion: 0.29
Nodes (7): App(), GlobalOfflineBanner(), HtmlLangSync(), TenantDisplayBootstrap(), ThemedToaster(), useNetworkStatus(), AppRoutes()

### Community 120 - "Handbook Module"
Cohesion: 0.22
Nodes (7): ADMIN_MODULE_IDS, CASHIER_MODULE_IDS, HANDBOOK_GROUPS, modulesForScope(), ROUTE_MAP, useHandbookPage(), HandbookPage()

### Community 121 - "Product Catalog & Import"
Cohesion: 0.28
Nodes (8): ProductLifecycleFilters(), ProductLifecycleSummaryCard(), ProductLifecycleSummaryGrid(), ProductLifecycleSection(), useProductLifecycleSection(), useProductLifecycleReportPage(), ProductLifecycleReportPage(), ProductLifecycleReportPage

### Community 122 - "Hardware & Escpos Services"
Cohesion: 0.23
Nodes (8): buildEscposShiftReportLabels(), buildEscposShiftReportPayload(), readReceiptFields(), readShiftReportBranding(), buildEscposZReportLabels(), buildEscposZReportPayload(), readReceiptFields(), readZReportBranding()

### Community 123 - "Hardware & Escpos Services"
Cohesion: 0.35
Nodes (8): isOfflineFirstDesktop(), POS_CATALOG_ONLINE_TIMEOUT_MS, DEFAULT_OFFLINE_CHECKOUT_TIMEOUT_MS, OFFLINE_FIRST_CHECKOUT_TIMEOUT_MS, OFFLINE_FIRST_ONLINE_SALE_TIMEOUT_MS, resolveOfflineCheckoutTimeoutMs(), resolveOnlineCatalogTimeoutMs(), resolveOnlineSaleTimeoutMs()

### Community 124 - "Inventory & Stock Management"
Cohesion: 0.33
Nodes (7): StockAdjustModal(), WarehouseReceiveModal(), ProductsStockModals(), StockProductDeleteModal(), StockProductsFiltersDrawer(), StockProductsModals(), StockProductsRowMenu()

### Community 125 - "Utils Module"
Cohesion: 0.38
Nodes (6): getRestaurantAppUrl(), isRestaurantAppSplitEnabled(), RestaurantSpaHandoff(), isRestaurantSpaPath(), maybeRedirectRestaurantLogin(), redirectToRestaurantApp()

### Community 126 - "Ai Module"
Cohesion: 0.29
Nodes (7): AiAssistantChartPanel(), AiAssistantWidget(), toApiHistory(), truncateHistoryContent(), useAiAssistantPage(), AiAssistantPage(), AiAssistantPage

### Community 127 - "Super Admin Platform"
Cohesion: 0.29
Nodes (7): PlatformDesktopBroadcastForm(), KIND_OPTIONS, PlatformDesktopKindChips(), PlatformDesktopNotificationsHistory(), resolveLocale(), usePlatformDesktopNotificationsPage(), PlatformDesktopNotificationsPage()

### Community 128 - "Super Admin Platform"
Cohesion: 0.32
Nodes (6): PlatformModuleAccessModulesBody(), PlatformModuleAccessModulesFooter(), PlatformModuleAccessModulesHeader(), PlatformModuleAccessModulesPlaceholder(), PlatformModuleAccessModuleGroup(), PlatformModuleAccessModulesPanel()

### Community 129 - "Product Catalog & Import"
Cohesion: 0.35
Nodes (5): TasnifPackagePickerModal(), TasnifSearchInput(), TasnifSearchResultsList(), TasnifSearchPanel(), BarcodePrintModals()

### Community 130 - "Product Catalog & Import"
Cohesion: 0.35
Nodes (6): ProductFiltersDrawerFooter(), ProductFiltersDrawerHeader(), ProductFiltersFields(), ProductFiltersDrawer(), PRODUCT_FILTERS_SLIDE_IN_STYLE, productFiltersInputCls

### Community 131 - "Product Catalog & Import"
Cohesion: 0.35
Nodes (7): ProductInfoModalFooter(), ProductInfoModalHeader(), ProductInfoModalTabBar(), ProductInfoModal(), ProductLifecycleSection, useProductInfoModal(), productInfoTabBtn()

### Community 132 - "Public Landing Pages"
Cohesion: 0.38
Nodes (6): PublicFloatingChat(), PublicScrollTop(), PublicSitePageShell(), headerOffset(), scrollToPublicSection(), usePublicHashScroll()

### Community 133 - "Hardware & Escpos Services"
Cohesion: 0.40
Nodes (7): FISCAL_STATUS, parseFiscalDriveRegisterResult(), pickCI(), toFiscalDriveSalePayload(), unwrapRegisterPayload(), WRAPPER_KEYS, toSaleFiscalPayload()

### Community 134 - "Utils Module"
Cohesion: 0.24
Nodes (10): ELECTRON_PRINT_CAPTURING_CLASS, ELECTRON_SILENT_PRINT_CLASS, injectThermalPageRule(), POS_RECEIPT_PRINT_EVENT, prepareThermalPrint(), PRINT_THERMAL_CLASS, PRINT_THERMAL_MODAL_CLASS, printWithHtmlClass() (+2 more)

### Community 135 - "Super Admin Platform"
Cohesion: 0.33
Nodes (7): CATALOG_FORM_FIELD_DEFS, CATALOG_FORM_FIELD_GROUPS, CATALOG_FORM_FIELD_PREFIX, defsForGroup(), LEGACY_SECTION_EXPAND, PlatformBusinessTypeFormFieldGroup(), PlatformBusinessTypeFormFields()

### Community 136 - "Utils Module"
Cohesion: 0.64
Nodes (6): useProductCatalogAutoIds(), useTasnifSearchPanel(), buildTasnifExternalId(), buildTasnifSku(), isAutoTasnifExternalId(), isAutoTasnifSku()

### Community 137 - "Community 137"
Cohesion: 0.22
Nodes (9): scripts, build, check:modules, dev, lint, preview, test, test:watch (+1 more)

### Community 138 - "Shared Components & Pagination"
Cohesion: 0.47
Nodes (4): AppBootPlaceholder(), AuthBootstrap(), RouteFallback(), isCashierPinLoginPath()

### Community 139 - "Product Catalog & Import"
Cohesion: 0.50
Nodes (5): buildProductCatalogPayload(), isCatalogSectionOn(), pickVisibleCatalogFormValues(), positiveOr(), buildAttributesPayload()

### Community 140 - "Pharmacy Cashier & ASL"
Cohesion: 0.36
Nodes (7): usePharmacyAslRequestLogPage(), formatWhen(), operationLabel(), outcomeClass(), outcomeLabel(), PharmacyAslRequestLogPage(), PharmacyAslRequestLogPage

### Community 141 - "Pharmacy Cashier & ASL"
Cohesion: 0.44
Nodes (6): usePharmacyMxikPick(), applyMxikFlags(), inferMarkedProduct(), inferPrescriptionRequired(), realTasnifPackages(), tasnifPackageLabel()

### Community 142 - "Reports & Analytics"
Cohesion: 0.39
Nodes (5): ReportsHubSection(), REPORTS_HUB_SALES_LINKS, REPORTS_HUB_STOCK_LINKS, useReportsHubPage(), ReportsHubPage()

### Community 143 - "Hardware & Escpos Services"
Cohesion: 0.50
Nodes (8): buildError(), encodeRequestBody(), isHttpsPageWithoutDesktop(), joinUrl(), localDeviceHttpRequest(), pickErrorMessage(), viaDesktop(), viaFetch()

### Community 144 - "Utils Module"
Cohesion: 0.54
Nodes (5): ProductCatalogStorePricesSection(), buildStorePrices(), resolveStorePricesForPayload(), syncStoreRowPrices(), toPositivePrice()

### Community 145 - "Pharmacy Cashier & ASL"
Cohesion: 0.46
Nodes (5): PharmacyPackageField(), PharmacyProductAboutFields(), productAtc(), unique(), usePharmacyCatalogOptions()

### Community 146 - "Pharmacy Cashier & ASL"
Cohesion: 0.68
Nodes (6): linePurchaseSum(), lineRetailSum(), receiptDisplayTotals(), round2(), sumReceiptPurchase(), sumReceiptRetail()

### Community 147 - "Billing & Payment Ledger"
Cohesion: 0.48
Nodes (5): cardFormComplete(), digitsOnly(), formatCardExpiry(), formatCardNumber(), maskedPan()

### Community 148 - "Product Catalog & Import"
Cohesion: 0.48
Nodes (3): ProductCatalogModalFooter(), ProductCatalogModalHeader(), ProductCatalogModal()

### Community 149 - "Community 149"
Cohesion: 0.48
Nodes (4): queryClient, queryRetryDelay(), shouldRetryQuery(), statusOf()

### Community 150 - "Community 150"
Cohesion: 0.33
Nodes (6): Feature Module Pattern, Scales Barcode Printing System, Shelf Label Print System, TanStack React Query Server State, Web Frontend Architecture, Zustand Client State

### Community 151 - "Shared Components & Pagination"
Cohesion: 0.53
Nodes (4): AppViewportSync(), HTML_CLASS, readProfile(), useAppViewportProfile()

### Community 153 - "Cashier POS & Checkout"
Cohesion: 0.73
Nodes (5): fmtAt(), moneyNum(), MoneyRow(), Row(), ShiftReportPrintBody()

### Community 154 - "Product Catalog & Import"
Cohesion: 0.53
Nodes (4): SupplierFiltersDrawer(), useSuppliersPage(), SuppliersPage(), SuppliersPage

### Community 156 - "Super Admin Platform"
Cohesion: 0.60
Nodes (4): DetailRow(), PlatformLeadDetailModal(), usePlatformLeadsPage(), PlatformLeadsPage()

### Community 157 - "Shared Components & Pagination"
Cohesion: 0.70
Nodes (3): UnitsCatalogBootstrap(), useUnitsCatalog(), hydrateUnitsCatalog()

### Community 158 - "Reports & Analytics"
Cohesion: 0.83
Nodes (3): monthStartIso(), todayIso(), useReportingSyncPage()

## Knowledge Gaps
- **5 isolated node(s):** `Feature Module Pattern`, `Zustand Client State`, `TanStack React Query Server State`, `Scales Barcode Printing System`, `Shelf Label Print System`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 450 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Reports & Analytics` to `Pharmacy Cashier & ASL`, `Super Admin Platform`, `API Client & Endpoints`, `Product Catalog & Import`, `Pharmacy Cashier & ASL`, `Pharmacy Cashier & ASL`, `Cash Module`, `Cash Module`, `Hardware & Escpos Services`, `Cashier POS & Checkout`, `Finance & Cash Flow`, `Finance & Cash Flow`, `Public Landing Pages`, `App Routing & Layout`, `Reports & Analytics`, `Tenant Stores & Branches`, `Hardware & Escpos Services`, `Inventory & Stock Management`, `Pharmacy Cashier & ASL`, `Analytics Dashboard & Charts`, `Sales Module`, `Cashier POS & Checkout`, `Utils Module`, `Cashier POS & Checkout`, `App Routing & Layout`, `Zustand State Stores`, `Tenant Stores & Branches`, `UI Base Components`, `Utils Module`, `Pharmacy Cashier & ASL`, `Super Admin Platform`, `Electronic Scales Integration`, `Utils Module`, `Super Admin Platform`, `App Routing & Layout`, `Super Admin Platform`, `ASL Marking Verification`, `Layout Module`, `Layout Module`, `Utils Module`, `Finance & Cash Flow`, `Product Catalog & Import`, `Inventory & Stock Management`, `Utils Module`, `Zustand State Stores`, `Layout Module`, `Super Admin Platform`, `Billing & Payment Ledger`, `Super Admin Platform`, `Utils Module`, `Super Admin Platform`, `Pharmacy Cashier & ASL`, `Zustand State Stores`, `Cashier POS & Checkout`, `Utils Module`, `Cashier POS & Checkout`, `Cashier POS & Checkout`, `Hardware & Escpos Services`, `Cashier POS & Checkout`, `Hardware & Escpos Services`, `Pharmacy Cashier & ASL`, `Cashier POS & Checkout`, `Utils Module`, `Pharmacy Cashier & ASL`, `Utils Module`, `Pharmacy Cashier & ASL`, `Hardware & Escpos Services`, `Product Catalog & Import`, `Utils Module`, `Super Admin Platform`, `Authentication & Session`, `Tenant Stores & Branches`, `Support Module`, `Receipt Module`, `Product Catalog & Import`, `Product Catalog & Import`, `Public Landing Pages`, `Cashier POS & Checkout`, `Cashier POS & Checkout`, `Utils Module`, `Pharmacy Cashier & ASL`, `Utils Module`, `Super Admin Platform`, `Cashier POS & Checkout`, `Inventory & Stock Management`, `Utils Module`, `Pharmacy Cashier & ASL`, `Super Admin Platform`, `Utils Module`, `Shared Components & Pagination`, `Handbook Module`, `Utils Module`, `Ai Module`, `Public Landing Pages`, `Utils Module`, `Shared Components & Pagination`, `Pharmacy Cashier & ASL`, `Reports & Analytics`, `Pharmacy Cashier & ASL`, `Shared Components & Pagination`, `Reports & Analytics`?**
  _High betweenness centrality (0.226) - this node is a cross-community bridge._
- **What connects `Feature Module Pattern`, `Zustand Client State`, `TanStack React Query Server State` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Pharmacy Cashier & ASL` be split into smaller, more focused modules?**
  _Cohesion score 0.07237512742099898 - nodes in this community are weakly interconnected._
- **Why does `react-i18next` connect `Reports & Analytics` to `Pharmacy Cashier & ASL`, `Super Admin Platform`, `API Client & Endpoints`, `Product Catalog & Import`, `Pharmacy Cashier & ASL`, `Cash Module`, `Cash Module`, `Hardware & Escpos Services`, `Cashier POS & Checkout`, `Finance & Cash Flow`, `Public Landing Pages`, `Tenant Stores & Branches`, `Hardware & Escpos Services`, `Inventory & Stock Management`, `Pharmacy Cashier & ASL`, `Analytics Dashboard & Charts`, `Sales Module`, `Reports & Analytics`, `Cashier POS & Checkout`, `Utils Module`, `Cashier POS & Checkout`, `App Routing & Layout`, `Zustand State Stores`, `Tenant Stores & Branches`, `UI Base Components`, `Utils Module`, `Pharmacy Cashier & ASL`, `Super Admin Platform`, `Electronic Scales Integration`, `Super Admin Platform`, `App Routing & Layout`, `Super Admin Platform`, `ASL Marking Verification`, `Layout Module`, `Hardware & Escpos Services`, `Layout Module`, `Utils Module`, `Product Catalog & Import`, `Utils Module`, `Layout Module`, `Billing & Payment Ledger`, `Desktop Module`, `Super Admin Platform`, `Utils Module`, `Pharmacy Cashier & ASL`, `Zustand State Stores`, `Cashier POS & Checkout`, `Utils Module`, `Cashier POS & Checkout`, `Hardware & Escpos Services`, `Pharmacy Cashier & ASL`, `Cashier POS & Checkout`, `Orders & Fulfillment`, `Pharmacy Cashier & ASL`, `Utils Module`, `Hardware & Escpos Services`, `Product Catalog & Import`, `Utils Module`, `Super Admin Platform`, `Reports & Analytics`, `Tenant Stores & Branches`, `Support Module`, `Receipt Module`, `Product Catalog & Import`, `Public Landing Pages`, `Cashier POS & Checkout`, `Cashier POS & Checkout`, `Pharmacy Cashier & ASL`, `Super Admin Platform`, `Cashier POS & Checkout`, `Inventory & Stock Management`, `Pharmacy Cashier & ASL`, `Utils Module`, `Utils Module`, `Shared Components & Pagination`, `Handbook Module`, `Product Catalog & Import`, `Hardware & Escpos Services`, `Inventory & Stock Management`, `Utils Module`, `Ai Module`, `Super Admin Platform`, `Product Catalog & Import`, `Product Catalog & Import`, `Product Catalog & Import`, `Public Landing Pages`, `Utils Module`, `Pharmacy Cashier & ASL`, `Reports & Analytics`, `Cashier POS & Checkout`, `Product Catalog & Import`, `Reports & Analytics`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Should `Super Admin Platform` be split into smaller, more focused modules?**
  _Cohesion score 0.04927211646136618 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `UI Base Components` to `Pharmacy Cashier & ASL`, `Product Catalog & Import`, `Pharmacy Cashier & ASL`, `Pharmacy Cashier & ASL`, `Cash Module`, `Hardware & Escpos Services`, `Hardware & Escpos Services`, `Utils Module`, `Product Catalog & Import`, `Tenant Stores & Branches`, `Hardware & Escpos Services`, `Utils Module`, `Pharmacy Cashier & ASL`, `Pharmacy Cashier & ASL`, `Community 149`, `Utils Module`, `Shared Components & Pagination`, `App Routing & Layout`, `Cashier POS & Checkout`, `Pharmacy Cashier & ASL`, `Tenant Stores & Branches`, `Hardware & Escpos Services`, `Utils Module`, `Pharmacy Cashier & ASL`, `Super Admin Platform`, `Hardware & Escpos Services`, `Utils Module`, `Super Admin Platform`, `App Routing & Layout`, `ASL Marking Verification`, `Super Admin Platform`, `ASL Marking Verification`, `Layout Module`, `Hardware & Escpos Services`, `Hardware & Escpos Services`, `Inventory & Stock Management`, `Utils Module`, `Utils Module`, `ASL Marking Verification`, `Super Admin Platform`, `Billing & Payment Ledger`, `Super Admin Platform`, `Zustand State Stores`, `Cashier POS & Checkout`, `Cashier POS & Checkout`, `Cashier POS & Checkout`, `ASL Marking Verification`, `Cashier POS & Checkout`, `Cashier POS & Checkout`, `Hardware & Escpos Services`, `Pharmacy Cashier & ASL`, `Cashier POS & Checkout`, `Utils Module`, `Pharmacy Cashier & ASL`, `Product Catalog & Import`, `Super Admin Platform`, `Authentication & Session`, `Tenant Stores & Branches`, `Hardware & Escpos Services`, `Product Catalog & Import`, `Cashier POS & Checkout`, `Hardware & Escpos Services`, `Cashier POS & Checkout`, `Pharmacy Cashier & ASL`, `Utils Module`, `Cashier POS & Checkout`, `Pharmacy Cashier & ASL`, `Super Admin Platform`, `Shared Components & Pagination`, `Hardware & Escpos Services`, `Utils Module`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Should `API Client & Endpoints` be split into smaller, more focused modules?**
  _Cohesion score 0.05909351692484223 - nodes in this community are weakly interconnected._