package com.pos.inventory.service.impl;

import com.pos.dto.shared.PageResponse;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.inventory.dto.supplier.CreateSupplierRequest;
import com.pos.inventory.dto.supplier.SupplierResponse;
import com.pos.inventory.dto.supplier.UpdateSupplierRequest;
import com.pos.inventory.entity.Supplier;
import com.pos.inventory.mapper.SupplierMapper;
import com.pos.inventory.repository.StockReceiptRepository;
import com.pos.inventory.repository.SupplierRepository;
import com.pos.inventory.repository.spec.SupplierSpecifications;
import com.pos.inventory.service.SupplierService;
import com.pos.inventory.service.support.SupplierMutationSupport;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final StockReceiptRepository stockReceiptRepository;
    private final SupplierMapper supplierMapper;
    private final TenantAccessSupport tenantAccess;

    @Override
    public PageResponse<SupplierResponse> list(String search, LocalDate createdOn, Pageable pageable) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Specification<Supplier> spec = SupplierSpecifications.filter(companyId, search, createdOn);
        Page<Supplier> page = supplierRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(supplierMapper::toResponse));
    }

    @Override
    @Transactional
    public SupplierResponse create(CreateSupplierRequest req) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        String taxId = req.taxId().trim();
        if (supplierRepository.existsByCompanyIdAndTaxId(companyId, taxId)) {
            throw new BadRequestException("Поставщик с таким ИНН/ПИНФЛ уже существует");
        }

        Supplier s = Supplier.builder()
            .company(tenantAccess.requireCompany(companyId))
            .build();
        SupplierMutationSupport.applyFields(s, req.name(), taxId, req.accountNumber(), req.phone());
        Supplier saved = supplierRepository.save(s);
        LogUtil.info(SupplierServiceImpl.class, "Supplier created: id={}, taxId={}", saved.getId(), saved.getTaxId());
        return supplierMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public SupplierResponse update(UUID id, UpdateSupplierRequest req) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Supplier supplier = requireCompanySupplier(id, companyId);
        String taxId = req.taxId().trim();
        if (supplierRepository.existsByCompanyIdAndTaxIdAndIdNot(companyId, taxId, id)) {
            throw new BadRequestException("Поставщик с таким ИНН/ПИНФЛ уже существует");
        }
        SupplierMutationSupport.applyFields(
            supplier, req.name(), taxId, req.accountNumber(), req.phone()
        );
        Supplier saved = supplierRepository.save(supplier);
        LogUtil.info(SupplierServiceImpl.class, "Supplier updated: id={}, taxId={}", saved.getId(), saved.getTaxId());
        return supplierMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Supplier supplier = requireCompanySupplier(id, companyId);
        if (stockReceiptRepository.existsBySupplier_Id(id)) {
            throw new BadRequestException("Нельзя удалить поставщика: есть связанные приходные документы");
        }
        supplierRepository.delete(supplier);
        LogUtil.info(SupplierServiceImpl.class, "Supplier deleted: id={}", id);
    }

    private Supplier requireCompanySupplier(UUID id, Integer companyId) {
        return supplierRepository.findByIdAndCompany_Id(id, companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
    }
}
