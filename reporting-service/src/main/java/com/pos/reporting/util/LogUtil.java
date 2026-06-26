package com.pos.reporting.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class LogUtil {

    private LogUtil() {}

    public static void info(Class<?> source, String message, Object... args) {
        logger(source).info(message, args);
    }

    public static void warn(Class<?> source, String message, Object... args) {
        logger(source).warn(message, args);
    }

    private static Logger logger(Class<?> source) {
        return LoggerFactory.getLogger(source);
    }
}
