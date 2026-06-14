package com.pos.finance.entity;

import com.pos.finance.entity.base.CompanyCategoryEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "expense_categories")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class ExpenseCategory extends CompanyCategoryEntity {

    @Override
    protected String defaultCategoryType() {
        return "EXPENSE";
    }
}
