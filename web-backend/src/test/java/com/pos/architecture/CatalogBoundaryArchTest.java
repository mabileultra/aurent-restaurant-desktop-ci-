package com.pos.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * Enforces grocery catalog / stock ownership boundaries (waves A–D).
 * Allowed ProductRepository users: {@code com.pos.catalog..} and StoreStockService (denorm cache write).
 */
class CatalogBoundaryArchTest {

    private static JavaClasses classes;

    @BeforeAll
    static void importClasses() {
        classes = new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages("com.pos");
    }

    @Test
    void productRepository_onlyInCatalog_orStoreStockService() {
        ArchRule rule = noClasses()
            .that().resideOutsideOfPackage("com.pos.catalog..")
            .and().doNotHaveFullyQualifiedName("com.pos.inventory.service.stock.StoreStockService")
            .should().dependOnClassesThat()
            .haveFullyQualifiedName("com.pos.catalog.repository.ProductRepository")
            .because("Outside catalog use CatalogFacade / CatalogManagedProductLoader; "
                + "only StoreStockService may touch ProductRepository for denorm stock cache");

        rule.check(classes);
    }

    @Test
    void salesAndInventoryServices_doNotInjectProductRepository() {
        ArchRule rule = noClasses()
            .that().resideInAnyPackage(
                "com.pos.sales..",
                "com.pos.inventory..",
                "com.pos.scales..",
                "com.pos.integrations.finance..",
                "com.pos.integrations.telegram.."
            )
            .and().doNotHaveFullyQualifiedName("com.pos.inventory.service.stock.StoreStockService")
            .should().dependOnClassesThat()
            .haveFullyQualifiedName("com.pos.catalog.repository.ProductRepository");

        rule.check(classes);
    }
}
