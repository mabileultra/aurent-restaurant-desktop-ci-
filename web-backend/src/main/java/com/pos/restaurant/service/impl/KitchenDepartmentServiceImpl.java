package com.pos.restaurant.service.impl;

import com.pos.entity.ReferenceBook;
import com.pos.entity.ReferenceBookEntry;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.ReferenceBookEntryRepository;
import com.pos.repository.ReferenceBookRepository;
import com.pos.restaurant.dto.KitchenDepartmentResponse;
import com.pos.restaurant.dto.SaveKitchenDepartmentRequest;
import com.pos.restaurant.service.KitchenDepartmentService;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KitchenDepartmentServiceImpl implements KitchenDepartmentService {

    static final String BOOK_CODE = "kitchen_departments";

    private final ReferenceBookRepository bookRepository;
    private final ReferenceBookEntryRepository entryRepository;

    @Override
    public List<KitchenDepartmentResponse> list() {
        return entryRepository.findByReferenceBook_IdOrderBySortOrderAscIdAsc(requireBook().getId()).stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional
    @CacheEvict(value = "businessConfig", allEntries = true)
    public KitchenDepartmentResponse create(SaveKitchenDepartmentRequest request) {
        ReferenceBook book = requireBook();
        String value = normalizeValue(request.value());
        assertValueUnique(book.getId(), value, null);
        int sortOrder = resolveSortOrder(request.sortOrder(), book.getId());
        ReferenceBookEntry entry = ReferenceBookEntry.builder()
            .referenceBook(book)
            .value(value)
            .label(request.label().trim())
            .sortOrder(sortOrder)
            .build();
        ReferenceBookEntry saved = entryRepository.save(entry);
        LogUtil.info(KitchenDepartmentServiceImpl.class, "Kitchen department created: {}", value);
        return toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "businessConfig", allEntries = true)
    public KitchenDepartmentResponse update(Integer entryId, SaveKitchenDepartmentRequest request) {
        ReferenceBookEntry entry = requireEntry(entryId);
        String value = normalizeValue(request.value());
        assertValueUnique(entry.getReferenceBook().getId(), value, entryId);
        entry.setValue(value);
        entry.setLabel(request.label().trim());
        if (request.sortOrder() != null) {
            entry.setSortOrder(request.sortOrder());
        }
        LogUtil.info(KitchenDepartmentServiceImpl.class, "Kitchen department updated: id={}", entryId);
        return toResponse(entry);
    }

    @Override
    @Transactional
    @CacheEvict(value = "businessConfig", allEntries = true)
    public void delete(Integer entryId) {
        ReferenceBookEntry entry = requireEntry(entryId);
        entryRepository.delete(entry);
        LogUtil.info(KitchenDepartmentServiceImpl.class, "Kitchen department deleted: id={}", entryId);
    }

    private ReferenceBook requireBook() {
        return bookRepository.findByCodeIgnoreCase(BOOK_CODE)
            .orElseThrow(() -> new ResourceNotFoundException("Kitchen departments reference book not found"));
    }

    private ReferenceBookEntry requireEntry(Integer entryId) {
        ReferenceBook book = requireBook();
        ReferenceBookEntry entry = entryRepository.findById(entryId)
            .orElseThrow(() -> new ResourceNotFoundException("Kitchen department not found"));
        if (!book.getId().equals(entry.getReferenceBook().getId())) {
            throw new ResourceNotFoundException("Kitchen department not found");
        }
        return entry;
    }

    private void assertValueUnique(Integer bookId, String value, Integer excludeId) {
        boolean exists = entryRepository.findByReferenceBook_IdOrderBySortOrderAscIdAsc(bookId).stream()
            .anyMatch(e -> e.getValue().equalsIgnoreCase(value) && !e.getId().equals(excludeId));
        if (exists) {
            throw new BadRequestException("Kitchen department code already exists: " + value);
        }
    }

    private int resolveSortOrder(Integer requested, Integer bookId) {
        if (requested != null) {
            return requested;
        }
        return entryRepository.findByReferenceBook_IdOrderBySortOrderAscIdAsc(bookId).stream()
            .mapToInt(ReferenceBookEntry::getSortOrder)
            .max()
            .orElse(0) + 10;
    }

    private String normalizeValue(String raw) {
        String value = raw.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", "_");
        if (value.isBlank()) {
            throw new BadRequestException("Department code is required");
        }
        return value;
    }

    private KitchenDepartmentResponse toResponse(ReferenceBookEntry entry) {
        return new KitchenDepartmentResponse(entry.getId(), entry.getValue(), entry.getLabel(), entry.getSortOrder());
    }
}
