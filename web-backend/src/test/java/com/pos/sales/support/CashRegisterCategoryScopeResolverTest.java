package com.pos.sales.support;

import com.pos.catalog.entity.Category;
import com.pos.entity.Store;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.entity.CashRegisterConfig;
import com.pos.sales.repository.CashRegisterConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashRegisterCategoryScopeResolverTest {

    @Mock private CashRegisterConfigRepository configRepository;

    private CashRegisterCategoryScopeResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new CashRegisterCategoryScopeResolver(configRepository);
    }

    @Test
    void noCandidates_unrestricted() {
        when(configRepository.findCandidatesForPosScope(eq(1), eq(10L))).thenReturn(List.of());
        assertThat(resolver.resolve(1, 10L).restricted()).isFalse();
    }

    @Test
    void registerLinkedConfig_restrictsToCategories() {
        CashRegisterConfig cfg = config(
            Set.of(),
            Set.of(register(10L)),
            Set.of(category(101), category(102))
        );
        when(configRepository.findCandidatesForPosScope(eq(1), eq(10L))).thenReturn(List.of(cfg));

        CashRegisterCategoryScope scope = resolver.resolve(1, 10L);
        assertThat(scope.restricted()).isTrue();
        assertThat(scope.categoryIds()).containsExactlyInAnyOrder(101, 102);
    }

    @Test
    void storeOnlyConfig_appliesWhenNoRegistersOnConfig() {
        CashRegisterConfig cfg = config(
            Set.of(store(1)),
            Set.of(),
            Set.of(category(55))
        );
        when(configRepository.findCandidatesForPosScope(eq(1), eq(null))).thenReturn(List.of(cfg));

        CashRegisterCategoryScope scope = resolver.resolve(1, null);
        assertThat(scope.restricted()).isTrue();
        assertThat(scope.categoryIds()).containsExactly(55);
    }

    @Test
    void registerConfig_ignoredWithoutCashRegisterId() {
        CashRegisterConfig cfg = config(
            Set.of(store(1)),
            Set.of(register(10L)),
            Set.of(category(55))
        );
        when(configRepository.findCandidatesForPosScope(eq(1), eq(null))).thenReturn(List.of(cfg));

        assertThat(resolver.resolve(1, null).restricted()).isFalse();
    }

    @Test
    void orphanCategoriesOnly_doesNotMatch() {
        CashRegisterConfig cfg = config(Set.of(), Set.of(), Set.of(category(1)));
        when(configRepository.findCandidatesForPosScope(eq(1), eq(10L))).thenReturn(List.of(cfg));

        assertThat(resolver.resolve(1, 10L).restricted()).isFalse();
    }

    @Test
    void matches_helper_lockedDefaultSkipped() {
        CashRegisterConfig locked = CashRegisterConfig.builder()
            .lockedDefault(true)
            .stores(Set.of(store(1)))
            .registers(Set.of())
            .categories(Set.of(category(1)))
            .build();
        assertThat(CashRegisterCategoryScopeResolver.matches(locked, 1, null)).isFalse();
    }

    private static CashRegisterConfig config(
        Set<Store> stores,
        Set<CashRegister> registers,
        Set<Category> categories
    ) {
        return CashRegisterConfig.builder()
            .lockedDefault(false)
            .stores(stores)
            .registers(registers)
            .categories(categories)
            .build();
    }

    private static Store store(int id) {
        return Store.builder().id(id).build();
    }

    private static CashRegister register(long id) {
        return CashRegister.builder().id(id).build();
    }

    private static Category category(int id) {
        return Category.builder().id(id).build();
    }
}
