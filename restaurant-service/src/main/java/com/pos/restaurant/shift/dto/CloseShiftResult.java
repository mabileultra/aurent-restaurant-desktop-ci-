package com.pos.restaurant.shift.dto;

public record CloseShiftResult(
    ShiftResponse shift,
    ShiftReportResponse zReport
) {}
