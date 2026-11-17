package com.blogtec.aurixwebapi.sync.builders;

import java.math.BigDecimal;

public class SyncUtils {
    public static BigDecimal toBd(Object val) {
        if (val == null)
            return BigDecimal.ZERO;
        if (val instanceof BigDecimal)
            return (BigDecimal) val;
        if (val instanceof Number)
            return BigDecimal.valueOf(((Number) val).doubleValue());
        try {
            return new BigDecimal(val.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
