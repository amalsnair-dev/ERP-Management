package com.blogtec.aurixwebapi.stocktaking;

import java.math.BigDecimal;

public class StockTakingStoneDetails {

    private BigDecimal caratWeight;
    private BigDecimal stoneCount;

    public StockTakingStoneDetails() {
    }

    public StockTakingStoneDetails(
            BigDecimal caratWeight,
            BigDecimal stoneCount) {

        this.caratWeight = caratWeight;
        this.stoneCount = stoneCount;
    }

    public BigDecimal getCaratWeight() {
        return caratWeight;
    }

    public void setCaratWeight(BigDecimal caratWeight) {
        this.caratWeight = caratWeight;
    }

    public BigDecimal getStoneCount() {
        return stoneCount;
    }

    public void setStoneCount(BigDecimal stoneCount) {
        this.stoneCount = stoneCount;
    }
}