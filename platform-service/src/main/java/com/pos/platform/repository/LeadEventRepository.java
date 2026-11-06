package com.pos.platform.repository;

import com.pos.platform.entity.LeadEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LeadEventRepository extends JpaRepository<LeadEvent, UUID> {

    List<LeadEvent> findByLead_IdOrderByCreatedAtDesc(UUID leadId);
}
