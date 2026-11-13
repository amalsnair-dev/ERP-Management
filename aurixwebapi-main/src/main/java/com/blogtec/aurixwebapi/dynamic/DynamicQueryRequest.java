package com.blogtec.aurixwebapi.dynamic;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class DynamicQueryRequest {
    
    private String sql;
    private String tablename;
    private Map<String, Object> params;


}
