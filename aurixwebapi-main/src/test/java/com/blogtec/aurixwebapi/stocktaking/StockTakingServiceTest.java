package com.blogtec.aurixwebapi.stocktaking;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StockTakingServiceTest {

    @Mock
    private StockTakingRepository stockTakingRepository;

    @InjectMocks
    private StockTakingService stockTakingService;

    private StockTakingItemDetails mockItemDetails;
    private StockTakingStoneDetails mockStoneDetails;

    @BeforeEach
    void setUp() {
        mockItemDetails = new StockTakingItemDetails();
        mockItemDetails.setBarcode("BC12345");
        mockItemDetails.setItemCode("ITEM01");
        mockItemDetails.setNum(new BigDecimal("1.00"));
        mockItemDetails.setNetWeight(new BigDecimal("10.50"));

        mockStoneDetails = new StockTakingStoneDetails();
    }

    @Test
    void testGetNextStockSerial() {
        when(stockTakingRepository.getNextStockSerial()).thenReturn(100L);
        Long serial = stockTakingService.getNextStockSerial();
        assertEquals(100L, serial);
        verify(stockTakingRepository).getNextStockSerial();
    }

    @Test
    void testInsertStockTaking() {
        StockTakingDto dto = new StockTakingDto();
        stockTakingService.insertStockTaking(dto);
        verify(stockTakingRepository).insertStockTaking(dto);
    }

    @Test
    void testDeleteStockTaking() {
        stockTakingService.deleteStockTaking("SL001");
        verify(stockTakingRepository).deleteStockTaking("SL001");
    }

    @Test
    void testDeleteStockTakingTransaction() {
        stockTakingService.deleteStockTakingTransaction("BC12345");
        verify(stockTakingRepository).deleteStockTakingTransaction("BC12345");
    }

    @Test
    void testValidateBarcodeTransaction_InvalidMasterEntry() {
        when(stockTakingRepository.masterEntryExists("SL001")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                stockTakingService.validateBarcodeTransaction("SL001", "BC12345"));
        assertEquals("INVALID_MASTER_ENTRY", ex.getMessage());
    }

    @Test
    void testValidateBarcodeTransaction_InvalidBarcode() {
        when(stockTakingRepository.masterEntryExists("SL001")).thenReturn(true);
        when(stockTakingRepository.barcodeExists("BC12345")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                stockTakingService.validateBarcodeTransaction("SL001", "BC12345"));
        assertEquals("INVALID_BARCODE", ex.getMessage());
    }

    @Test
    void testValidateBarcodeTransaction_ItemSold() {
        when(stockTakingRepository.masterEntryExists("SL001")).thenReturn(true);
        when(stockTakingRepository.barcodeExists("BC12345")).thenReturn(true);
        when(stockTakingRepository.barcodeIsAvailable("BC12345")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                stockTakingService.validateBarcodeTransaction("SL001", "BC12345"));
        assertEquals("ITEM_SOLD", ex.getMessage());
    }

    @Test
    void testValidateBarcodeTransaction_CategoryMismatch() {
        when(stockTakingRepository.masterEntryExists("SL001")).thenReturn(true);
        when(stockTakingRepository.barcodeExists("BC12345")).thenReturn(true);
        when(stockTakingRepository.barcodeIsAvailable("BC12345")).thenReturn(true);
        when(stockTakingRepository.categoryMatches("SL001", "BC12345")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                stockTakingService.validateBarcodeTransaction("SL001", "BC12345"));
        assertEquals("CATEGORY_MISMATCH", ex.getMessage());
    }

    @Test
    void testValidateBarcodeTransaction_AlreadyEntered() {
        when(stockTakingRepository.masterEntryExists("SL001")).thenReturn(true);
        when(stockTakingRepository.barcodeExists("BC12345")).thenReturn(true);
        when(stockTakingRepository.barcodeIsAvailable("BC12345")).thenReturn(true);
        when(stockTakingRepository.categoryMatches("SL001", "BC12345")).thenReturn(true);
        when(stockTakingRepository.barcodeAlreadyEntered("SL001", "BC12345")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                stockTakingService.validateBarcodeTransaction("SL001", "BC12345"));
        assertEquals("ALREADY_ENTERED", ex.getMessage());
    }

    @Test
    void testValidateBarcodeTransaction_Success() {
        when(stockTakingRepository.masterEntryExists("SL001")).thenReturn(true);
        when(stockTakingRepository.barcodeExists("BC12345")).thenReturn(true);
        when(stockTakingRepository.barcodeIsAvailable("BC12345")).thenReturn(true);
        when(stockTakingRepository.categoryMatches("SL001", "BC12345")).thenReturn(true);
        when(stockTakingRepository.barcodeAlreadyEntered("SL001", "BC12345")).thenReturn(false);
        when(stockTakingRepository.findBarcodeDetails("BC12345")).thenReturn(mockItemDetails);

        StockTakingItemDetails result = stockTakingService.validateBarcodeTransaction("SL001", "BC12345");
        assertNotNull(result);
        assertEquals("BC12345", result.getBarcode());
        assertEquals("ITEM01", result.getItemCode());
    }

    @Test
    void testAddStockTakingTransaction_Success() {
        when(stockTakingRepository.masterEntryExists("SL001")).thenReturn(true);
        when(stockTakingRepository.barcodeExists("BC12345")).thenReturn(true);
        when(stockTakingRepository.barcodeIsAvailable("BC12345")).thenReturn(true);
        when(stockTakingRepository.categoryMatches("SL001", "BC12345")).thenReturn(true);
        when(stockTakingRepository.barcodeAlreadyEntered("SL001", "BC12345")).thenReturn(false);
        when(stockTakingRepository.findBarcodeDetails("BC12345")).thenReturn(mockItemDetails);
        when(stockTakingRepository.findStoneDetails("BC12345")).thenReturn(mockStoneDetails);
        when(stockTakingRepository.getNextTransactionCounter()).thenReturn(1);

        StockTakingTransactionResponse response = stockTakingService.addStockTakingTransaction("SL001", "BC12345", "test-mac-id",  "192.168.1.25");

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("BC12345", response.getBarcode());
        assertEquals("ITEM01", response.getCode());
        assertEquals(new BigDecimal("1.00"), response.getQty());
        assertEquals(new BigDecimal("10.50"), response.getNetWt());

        verify(stockTakingRepository).insertStockTakingTransaction("SL001", 1, mockItemDetails, mockStoneDetails, "test-mac-id", "192.168.1.25");
    }

    @Test
    void testAddStockTakingTransaction_AlreadyEnteredDoesNotInsert() {
        when(stockTakingRepository.masterEntryExists("SL001")).thenReturn(true);
        when(stockTakingRepository.barcodeExists("BC12345")).thenReturn(true);
        when(stockTakingRepository.barcodeIsAvailable("BC12345")).thenReturn(true);
        when(stockTakingRepository.categoryMatches("SL001", "BC12345")).thenReturn(true);
        when(stockTakingRepository.barcodeAlreadyEntered("SL001", "BC12345")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                stockTakingService.addStockTakingTransaction("SL001", "BC12345", "test-mac-id", "192.168.1.25"));

        assertEquals("ALREADY_ENTERED", ex.getMessage());
        verify(stockTakingRepository, never()).insertStockTakingTransaction(
                anyString(), anyInt(), any(), any(), anyString(), anyString());
    }
}
