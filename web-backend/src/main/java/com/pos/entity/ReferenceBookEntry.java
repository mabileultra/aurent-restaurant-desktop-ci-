package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reference_book_entries")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReferenceBookEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reference_book_id", nullable = false)
    private ReferenceBook referenceBook;

    @Column(nullable = false, length = 100)
    private String value;

    @Column(nullable = false, length = 200)
    private String label;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 100;
}
