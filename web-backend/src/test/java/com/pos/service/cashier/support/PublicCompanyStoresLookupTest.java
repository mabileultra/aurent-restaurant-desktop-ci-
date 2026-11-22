package com.pos.service.cashier.support;

import com.pos.dto.cashier.PublicCompanyStoresResponse;
import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.repository.CompanyRepository;
import com.pos.repository.StoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublicCompanyStoresLookupTest {

    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private StoreRepository storeRepository;

    private PublicCompanyStoresLookup lookup;

    @BeforeEach
    void setUp() {
        lookup = new PublicCompanyStoresLookup(companyRepository, storeRepository);
    }

    @Test
    void listsActiveStoresByLoginCode() {
        Company company = Company.builder().id(7).name("Acme").loginCode("12345").active(true).build();
        when(companyRepository.findByLoginCodeIgnoreCase("12345")).thenReturn(Optional.of(company));
        when(storeRepository.findByCompanyIdAndActiveTrueOrderByNameAsc(7)).thenReturn(List.of(
            Store.builder().id(2).name("B").active(true).build(),
            Store.builder().id(1).name("A").active(true).build()
        ));

        PublicCompanyStoresResponse res = lookup.listByLoginCode("12345");

        assertThat(res.companyId()).isEqualTo(7);
        assertThat(res.companyLoginCode()).isEqualTo("12345");
        assertThat(res.stores()).extracting("id").containsExactly(2, 1);
        assertThat(res.stores()).extracting("name").containsExactly("B", "A");
    }

    @Test
    void rejectsUnknownCompany() {
        when(companyRepository.findByLoginCodeIgnoreCase("12345")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> lookup.listByLoginCode("12345"))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Company not found");
    }

    @Test
    void rejectsInactiveCompany() {
        Company company = Company.builder().id(7).name("Acme").loginCode("12345").active(false).build();
        when(companyRepository.findByLoginCodeIgnoreCase("12345")).thenReturn(Optional.of(company));
        assertThatThrownBy(() -> lookup.listByLoginCode("12345"))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("inactive");
    }
}
