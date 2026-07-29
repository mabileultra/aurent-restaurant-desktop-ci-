package com.pos.crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "customer_orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @Column(name = "store_name", length = 255)
    private String storeName;

    @Column(name = "external_number", length = 100)
    private String externalNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private OrderStatus status;

    @Column(name = "client_name", length = 255)
    private String clientName;

    @Column(name = "client_phone", length = 40)
    private String clientPhone;

    @Column(name = "delivery_address", columnDefinition = "TEXT")
    private String deliveryAddress;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "courier_id")
    private UUID courierId;

    @Column(name = "courier_name", length = 255)
    private String courierName;

    @Column(name = "payment_method", length = 20)
    private String paymentMethod;

    @Column(name = "receipt_number", length = 50)
    private String receiptNumber;

    @Column(name = "receipt_at")
    private Instant receiptAt;

    @Column(name = "total_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "created_by", nullable = false)
    private UUID createdById;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "customerOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CustomerOrderPhoto> photos = new ArrayList<>();
}
