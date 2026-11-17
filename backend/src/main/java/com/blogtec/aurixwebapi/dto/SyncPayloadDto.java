package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;
import java.util.List;

public class SyncPayloadDto {
    public String companyCode;
    public String branchCode;
    public String date; 
    public Boolean isDayReset = false;
    public String resetTime;

    public List<MetalSyncDto> metalSummaries;
    public OrderSyncDto orderSummary;
    public SchemeSyncDto schemeSummary;
    public CollectionSyncDto collectionSummary;
    public List<CollectionDetailSyncDto> collectionDetails;
    public CashSyncDto cashSummary;
    public List<NumanaCatHeadSyncDto> numanaCatHeads;
    public List<SplitupSyncDto> splitups;
    public DateAndRateSyncDto dateAndRate;
    public List<SmithReportSyncDto> smithReports;

    public static class SmithReportSyncDto {
        public String type;
        public String code;
        public String name;
        public String subcode;
        public String mode;
        public String date;
        public BigDecimal nos = BigDecimal.ZERO;
        public BigDecimal grosswt = BigDecimal.ZERO;
        public BigDecimal stonewt = BigDecimal.ZERO;
        public BigDecimal netwt = BigDecimal.ZERO;
        public BigDecimal ctqty = BigDecimal.ZERO;
        public BigDecimal ctwt = BigDecimal.ZERO;
    }

    public static class DateAndRateSyncDto {
        public String thisday;
        public BigDecimal g999;
        public BigDecimal g995;
        public BigDecimal g994;
        public BigDecimal g916;
        public BigDecimal g875;
        public BigDecimal g78;
        public BigDecimal g75;
        public BigDecimal ogcash;
        public BigDecimal slv;
        public BigDecimal oslv;
        public BigDecimal bulslv;
        public BigDecimal slv50;
        public BigDecimal slv80;
        public BigDecimal slv995;
        public BigDecimal plt;
        public BigDecimal oplt;
        public BigDecimal g14;
        public BigDecimal g9;
        public String shopcode;
        public Boolean restflag = false;
        public String resetTime;
    }

    public static class SplitupSyncDto {
        public String transdate;
        public Integer slno;
        public String description;
        public String catcode;
        public String catname;
        public BigDecimal opnos;
        public BigDecimal opgwt;
        public BigDecimal rctnos;
        public BigDecimal rctgwt;
        public BigDecimal issnos;
        public BigDecimal issgwt;
        public BigDecimal closingnos;
        public BigDecimal closingwt;
    }

    public static class NumanaCatHeadSyncDto {
        public String transdate;
        public String code;
        public String counter;
        public String name;
        public BigDecimal opgwt;
        public BigDecimal opnos;
        public BigDecimal salgwt;
        public BigDecimal salnos;
        public BigDecimal rctgwt;
        public BigDecimal rctnos;
        public BigDecimal shortgwt;
        public BigDecimal shortnos;
        public BigDecimal barrctwt;
        public BigDecimal barrctnos;
        public BigDecimal barisswt;
        public BigDecimal barissnos;
        public BigDecimal closingwt;
        public BigDecimal closingnos;
        public BigDecimal opcwt;
        public BigDecimal opcno;
        public BigDecimal salcwt;
        public BigDecimal salcno;
        public BigDecimal rctcwt;
        public BigDecimal rctcno;
        public BigDecimal shortcwt;
        public BigDecimal shortcno;
        public BigDecimal barrctcwt;
        public BigDecimal barrctcno;
        public BigDecimal barisscwt;
        public BigDecimal barisscno;
        public BigDecimal closingcwt;
        public BigDecimal closingcno;
    }

    public static class MetalSyncDto {
        public String categoryCode;
        public String itemName;
        public BigDecimal salesWeight = BigDecimal.ZERO;
        public BigDecimal salesAmount = BigDecimal.ZERO;
        public BigDecimal purchaseWeight = BigDecimal.ZERO;
        public BigDecimal purchaseAmount = BigDecimal.ZERO;
        public BigDecimal creditNoteWeight = BigDecimal.ZERO;
        public BigDecimal creditNoteAmount = BigDecimal.ZERO;
        public BigDecimal lessMeltedWeight = BigDecimal.ZERO;
    }

    public static class OrderSyncDto {
        public BigDecimal openingOrderAmount = BigDecimal.ZERO;
        public BigDecimal todayOpenOrders = BigDecimal.ZERO;
        public BigDecimal advanceOrders = BigDecimal.ZERO;
        public BigDecimal paymentOrders = BigDecimal.ZERO;
        public BigDecimal closedOrders = BigDecimal.ZERO;
        public BigDecimal balanceOrders = BigDecimal.ZERO;
    }

    public static class SchemeSyncDto {
        public BigDecimal openingSchemeAmount = BigDecimal.ZERO;
        public BigDecimal openingSchemeWeight = BigDecimal.ZERO;
        public Integer openingSchemeCount = 0;
        public BigDecimal newSchemeAmount = BigDecimal.ZERO;
        public BigDecimal newSchemeWeight = BigDecimal.ZERO;
        public Integer newSchemeCount = 0;
        public BigDecimal collectionSchemeAmount = BigDecimal.ZERO;
        public BigDecimal collectionSchemeWeight = BigDecimal.ZERO;
        public BigDecimal closedSchemeAmount = BigDecimal.ZERO;
        public BigDecimal closedSchemeWeight = BigDecimal.ZERO;
        public Integer closedSchemeCount = 0;
        public BigDecimal balanceSchemeAmount = BigDecimal.ZERO;
        public BigDecimal balanceSchemeWeight = BigDecimal.ZERO;
        public Integer activeSchemeCount = 0;
    }

    public static class CollectionDetailSyncDto {
        public String acname;
        public BigDecimal saleAmount = BigDecimal.ZERO;
        public BigDecimal purchaseAmount = BigDecimal.ZERO;
        public BigDecimal creditNoteAmount = BigDecimal.ZERO;
        public BigDecimal orderAmount = BigDecimal.ZERO;
        public BigDecimal advanceOrderAmount = BigDecimal.ZERO;
        public BigDecimal advanceOrderPaymentAmount = BigDecimal.ZERO;
        public BigDecimal schemeAmount = BigDecimal.ZERO;
    }

    public static class CollectionSyncDto {
        public BigDecimal cashCollection = BigDecimal.ZERO;
        public BigDecimal todayCollectionCash = BigDecimal.ZERO;
        public BigDecimal upiCollection = BigDecimal.ZERO;
        public BigDecimal cardCollection = BigDecimal.ZERO;
        public BigDecimal bankCollection = BigDecimal.ZERO;
        public BigDecimal chequeCollection = BigDecimal.ZERO;
        public java.util.List<CollectionDetailSyncDto> collectionDetails = new java.util.ArrayList<>();
    }

    public static class CashSyncDto {
        public BigDecimal openingCash = BigDecimal.ZERO;
        public BigDecimal cashReceipts = BigDecimal.ZERO;
        public BigDecimal upiReceipts = BigDecimal.ZERO;
        public BigDecimal cardReceipts = BigDecimal.ZERO;
        public BigDecimal bankReceipts = BigDecimal.ZERO;
        public BigDecimal chequeReceipts = BigDecimal.ZERO;
        public BigDecimal todayCollectionCash = BigDecimal.ZERO;
        public BigDecimal cashPayments = BigDecimal.ZERO;
        public BigDecimal upiPayments = BigDecimal.ZERO;
        public BigDecimal cardPayments = BigDecimal.ZERO;
        public BigDecimal bankPayments = BigDecimal.ZERO;
        public BigDecimal chequePayments = BigDecimal.ZERO;
        public BigDecimal closingCash = BigDecimal.ZERO;
        public String resetTime;
    }
}
