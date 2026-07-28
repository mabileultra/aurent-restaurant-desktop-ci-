package com.pos.service.impl;

import com.pos.dto.business.*;
import com.pos.entity.ReferenceBook;
import com.pos.entity.ReferenceBookEntry;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.ReferenceBookRepository;
import com.pos.service.ReferenceBookService;
import com.pos.shared.log.LogUtil;
import com.pos.util.TextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReferenceBookServiceImpl implements ReferenceBookService {

    private final ReferenceBookRepository repository;

    @Override
    public List<ReferenceBookResponse> list() {
        return repository.findAllByOrderByNameAsc().stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    public ReferenceBookDetailResponse getById(Integer id) {
        return toDetailResponse(requireDetailed(id));
    }

    @Override
    @Transactional
    @CacheEvict(value = "businessConfig", allEntries = true)
    public ReferenceBookDetailResponse create(SaveReferenceBookRequest request) {
        String code = request.code().trim().toLowerCase();
        if (repository.existsByCodeIgnoreCase(code)) {
            throw new BadRequestException("Reference book code already exists: " + code);
        }
        ReferenceBook entity = ReferenceBook.builder()
            .code(code)
            .name(request.name().trim())
            .description(TextUtil.trimOrNull(request.description()))
            .active(request.active() == null || request.active())
            .build();
        applyEntries(entity, request.entries());
        ReferenceBook saved = repository.save(entity);
        LogUtil.info(ReferenceBookServiceImpl.class, "Reference book created: {}", code);
        return toDetailResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "businessConfig", allEntries = true)
    public ReferenceBookDetailResponse update(Integer id, UpdateReferenceBookRequest request) {
        ReferenceBook entity = requireDetailed(id);
        entity.setName(request.name().trim());
        entity.setDescription(TextUtil.trimOrNull(request.description()));
        if (request.active() != null) {
            entity.setActive(request.active());
        }
        entity.getEntries().clear();
        applyEntries(entity, request.entries());
        LogUtil.info(ReferenceBookServiceImpl.class, "Reference book updated: id={}", id);
        return toDetailResponse(entity);
    }

    @Override
    @Transactional
    @CacheEvict(value = "businessConfig", allEntries = true)
    public void delete(Integer id) {
        ReferenceBook entity = requireDetailed(id);
        repository.delete(entity);
        LogUtil.info(ReferenceBookServiceImpl.class, "Reference book deleted: id={}", id);
    }

    private ReferenceBook requireDetailed(Integer id) {
        return repository.findDetailedById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Reference book not found"));
    }

    private void applyEntries(ReferenceBook book, List<SaveReferenceBookEntryRequest> entries) {
        if (entries == null || entries.isEmpty()) {
            return;
        }
        int order = 10;
        for (SaveReferenceBookEntryRequest entry : entries) {
            book.getEntries().add(ReferenceBookEntry.builder()
                .referenceBook(book)
                .value(entry.value().trim())
                .label(entry.label().trim())
                .sortOrder(entry.sortOrder() != null ? entry.sortOrder() : order)
                .build());
            order += 10;
        }
    }

    private ReferenceBookResponse toResponse(ReferenceBook entity) {
        int count = entity.getEntries() == null ? 0 : entity.getEntries().size();
        return new ReferenceBookResponse(
            entity.getId(),
            entity.getCode(),
            entity.getName(),
            entity.getDescription(),
            entity.isActive(),
            count
        );
    }

    private ReferenceBookDetailResponse toDetailResponse(ReferenceBook entity) {
        List<ReferenceBookEntryResponse> entries = entity.getEntries() == null
            ? List.of()
            : entity.getEntries().stream()
                .sorted(Comparator.comparingInt(ReferenceBookEntry::getSortOrder).thenComparingInt(ReferenceBookEntry::getId))
                .map(e -> new ReferenceBookEntryResponse(e.getId(), e.getValue(), e.getLabel(), e.getSortOrder()))
                .toList();
        return new ReferenceBookDetailResponse(
            entity.getId(),
            entity.getCode(),
            entity.getName(),
            entity.getDescription(),
            entity.isActive(),
            entries
        );
    }
}
