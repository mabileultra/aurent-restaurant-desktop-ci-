package com.pos.service.businessconfig.support;

import com.pos.dto.business.BusinessFieldOptionResponse;
import com.pos.entity.BusinessTypeField;
import com.pos.entity.FieldOption;
import com.pos.entity.ReferenceBookEntry;
import com.pos.repository.ReferenceBookEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BusinessTypeFieldOptionsResolver {

    private final ReferenceBookEntryRepository entryRepository;

    public List<BusinessFieldOptionResponse> resolve(BusinessTypeField field) {
        if (field.getReferenceBook() != null) {
            return entryRepository.findByReferenceBook_IdOrderBySortOrderAscIdAsc(field.getReferenceBook().getId())
                .stream()
                .map(this::toOptionResponse)
                .toList();
        }
        return toInlineOptionResponses(field.getOptions());
    }

    private BusinessFieldOptionResponse toOptionResponse(ReferenceBookEntry entry) {
        return new BusinessFieldOptionResponse(entry.getId(), entry.getValue(), entry.getLabel(), entry.getSortOrder());
    }

    private List<BusinessFieldOptionResponse> toInlineOptionResponses(Collection<FieldOption> options) {
        if (options == null || options.isEmpty()) {
            return List.of();
        }
        return options.stream()
            .sorted(Comparator.comparingInt(FieldOption::getSortOrder).thenComparingInt(FieldOption::getId))
            .map(o -> new BusinessFieldOptionResponse(o.getId(), o.getValue(), o.getLabel(), o.getSortOrder()))
            .toList();
    }
}
