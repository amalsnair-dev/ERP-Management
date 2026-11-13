package com.blogtec.aurixwebapi.reflectionUtils;

import java.lang.reflect.Field;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReflectionUtils {
	
	private static final Logger logger = LoggerFactory.getLogger(ReflectionUtils.class);

	public static void updateFields(Object source, Object destination) {
        for (Field field : source.getClass().getDeclaredFields()) {
            try {
                field.setAccessible(true);
                Object newValue = field.get(source);
                Object existingValue = field.get(destination);

                if (newValue != null) {
                    if (newValue instanceof Number && ((Number) newValue).doubleValue() == 0.0) {
                        continue;
                    }
                    field.set(destination, newValue);
                }
            } catch (IllegalAccessException e) {
                logger.error("Failed reflection field update for field {}: {}", field.getName(), e.getMessage(), e);
            }
        }
    }

}
