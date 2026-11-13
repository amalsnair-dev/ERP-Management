package com.blogtec.aurixwebapi.payload;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SalesSmanPayload {
    private Integer estNo;
    private String estSman1;
    private String estSman2;
    private List<SalesmanItem> saleamen;

    @Getter
    @Setter
    public static class SalesmanItem {
        private Integer slno;
        private String smcode;
        private String smname;
    }
}
