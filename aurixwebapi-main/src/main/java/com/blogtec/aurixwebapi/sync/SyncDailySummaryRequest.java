package com.blogtec.aurixwebapi.sync;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncDailySummaryRequest {

    private String companyCode;
    private String branchCode;
    private String date;
}
