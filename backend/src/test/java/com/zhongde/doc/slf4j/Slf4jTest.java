package com.zhongde.doc.slf4j;

import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Slf4jTest {

    private static final Logger logger = LoggerFactory.getLogger(Slf4jTest.class);

    @Test
    public void testSlf4jApi() {
        logger.trace("TRACE level log");
        logger.debug("DEBUG level log");
        logger.info("INFO level log - application started");
        logger.warn("WARN level log");
        logger.error("ERROR level log");

        String docId = "doc_123456";
        String user = "zhangsan";
        logger.info("User [{}] joined document [{}]", user, docId);
    }
}
