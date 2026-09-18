package com.pos.sales.support;

import com.pos.sales.entity.CashRegister;

public record TerminalResolveResult(CashRegister register, boolean created) {}
