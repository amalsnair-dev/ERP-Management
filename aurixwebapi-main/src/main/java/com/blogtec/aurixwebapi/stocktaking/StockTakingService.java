package com.blogtec.aurixwebapi.stocktaking;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blogtec.aurixwebapi.stocktaking.*;

@Service
public class StockTakingService {

    private final StockTakingRepository stockTakingRepository;

    public StockTakingService(
            StockTakingRepository stockTakingRepository) {

        this.stockTakingRepository = stockTakingRepository;
    }

    public Long getNextStockSerial() {

        return stockTakingRepository.getNextStockSerial();
    }

    public void insertStockTaking(StockTakingDto stockTaking) {

        stockTakingRepository.insertStockTaking(stockTaking);
    }

    public void deleteStockTaking(String slno) {

        stockTakingRepository.deleteStockTaking(slno);
    }
    
    public void deleteStockTakingTransaction(
            String barcode) {

        stockTakingRepository.deleteStockTakingTransaction(
                barcode
        );
    }

  public StockTakingItemDetails validateBarcodeTransaction(
        String slno,
        String barcode) {

    if (!stockTakingRepository.masterEntryExists(slno)) {

        throw new IllegalArgumentException(
                "INVALID_MASTER_ENTRY"
        );
    }

    if (!stockTakingRepository.barcodeExists(barcode)) {

        throw new IllegalArgumentException(
                "INVALID_BARCODE"
        );
    }

    if (!stockTakingRepository.barcodeIsAvailable(barcode)) {

        throw new IllegalArgumentException(
                "ITEM_SOLD"
        );
    }

    if (!stockTakingRepository.categoryMatches(slno, barcode)) {

        throw new IllegalArgumentException(
                "CATEGORY_MISMATCH"
        );
    }

    if (stockTakingRepository.barcodeAlreadyEntered(
            slno,
            barcode)) {

        throw new IllegalArgumentException(
                "ALREADY_ENTERED"
        );
    }

    return stockTakingRepository.findBarcodeDetails(barcode);
}
  
 @Transactional
public StockTakingTransactionResponse addStockTakingTransaction(
        String slno,
        String barcode,
        String macId,
        String ip) {

    if (macId == null || macId.isBlank()) {
        throw new IllegalArgumentException("DEVICE_ID_REQUIRED");
    }

    StockTakingItemDetails details =
            validateBarcodeTransaction(slno, barcode);

    StockTakingStoneDetails stoneDetails =
            stockTakingRepository.findStoneDetails(barcode);

    Integer ctr = stockTakingRepository.getNextTransactionCounter();

    stockTakingRepository.insertStockTakingTransaction(
            slno,
            ctr,
            details,
            stoneDetails,
            macId,
            ip
    );

    return new StockTakingTransactionResponse(
            true,
            details.getBarcode(),
            details.getItemCode(),
            details.getNum(),
            details.getNetWeight(),
            details.getGrossWeight()
    );
}
  
}