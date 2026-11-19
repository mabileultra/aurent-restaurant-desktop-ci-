package com.pos.catalog.service.tasnif.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.catalog.dto.tasnif.MxikPackageDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TasnifMxikPackageMapperTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void mapPackages_readsNumericCodes() throws Exception {
        var node = mapper.readTree("""
            [
              {"code":1816972,"nameRu":"шт. (бутылка)  0.70 литр","packageType":"1"},
              {"code":1845417,"nameRu":"коробка=12 шт. (бутылка)  0.70 литр","packageType":"2"}
            ]
            """);
        List<MxikPackageDto> packages = TasnifMxikPackageMapper.mapPackages(node);
        assertThat(packages).hasSize(2);
        assertThat(packages.get(1).code()).isEqualTo("1845417");
        assertThat(packages.get(1).nameRu()).contains("коробка=12");
    }

    @Test
    void mergeByCode_keepsHistoryMultipack() {
        List<MxikPackageDto> primary = List.of(
            new MxikPackageDto("1816972", null, "шт. (бутылка)", null, null, "1")
        );
        List<MxikPackageDto> history = List.of(
            new MxikPackageDto("1816972", null, "шт. (бутылка)", null, null, "1"),
            new MxikPackageDto("1845417", null, "коробка=12 шт.", null, null, "2")
        );
        assertThat(TasnifMxikPackageMapper.mergeByCode(primary, history))
            .extracting(MxikPackageDto::code)
            .containsExactly("1816972", "1845417");
    }
}
