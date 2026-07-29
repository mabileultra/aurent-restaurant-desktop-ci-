package com.pos.service.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.repository.spec.ProductSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ProductLookupSupport {

    private final ProductRepository productRepository;

    public Optional<Product> findOne(ProductSpecifications.LookupBuilder lookup) {
        return findFirst(lookup, Sort.unsorted());
    }

    public Optional<Product> findFirst(ProductSpecifications.LookupBuilder lookup, Sort sort) {
        return productRepository.findAll(lookup.build(), PageRequest.of(0, 1, sort))
            .stream()
            .findFirst();
    }
}
