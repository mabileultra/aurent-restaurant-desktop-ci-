package com.pos.platform.repository;

import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.entity.BillingPaymentIntent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BillingPaymentIntentRepository extends JpaRepository<BillingPaymentIntent, UUID> {

    Optional<BillingPaymentIntent> findByProviderAndProviderTransId(BillingPaymentProvider provider, String providerTransId);
}
