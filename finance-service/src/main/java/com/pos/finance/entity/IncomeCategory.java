package com.pos.finance.entity;

import com.pos.finance.entity.base.CompanyCategoryEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "income_categories")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class IncomeCategory extends CompanyCategoryEntity {

    @Override
    protected String defaultCategoryType() {
        return "INCOME";
    }
}
