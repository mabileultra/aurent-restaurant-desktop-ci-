package com.pos.identity.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class LogUtil {

    private LogUtil() {
    }

    private static Logger logger(Class<?> type) {
        return LoggerFactory.getLogger(type);
    }

    public static void info(Class<?> type, String msg, Object... args) {
        logger(type).info(msg, args);
    }

    public static void warn(Class<?> type, String msg, Object... args) {
        logger(type).warn(msg, args);
    }

    public static void error(Class<?> type, String msg, Object... args) {
        logger(type).error(msg, args);
    }

    public static void error(Class<?> type, String msg, Throwable t) {
        logger(type).error(msg, t);
    }
}
