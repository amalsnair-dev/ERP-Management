package com.blogtec.aurixwebapi.sales;

import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;

import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;
import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;
import com.blogtec.aurixwebapi.dto.SalesBarcodeRequest;
import com.blogtec.aurixwebapi.dto.SalesBarcodeResponseDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/sales/barcode")
@Tag(name = "Sales Barcode Controller", description = "Handles barcode validation, details fetching and rules verification.")
public class SalesBarcodeController {

    private final SalesBarcodeService salesBarcodeService;
    private final ApiUserService apiUserService;
    private final UserService userService;
    private final RemoteDataFetcher remoteDataFetcher;
    private static final Logger log = LoggerFactory.getLogger(SalesBarcodeController.class);

    public SalesBarcodeController(SalesBarcodeService salesBarcodeService,
                                  ApiUserService apiUserService,
                                  UserService userService,
                                  RemoteDataFetcher remoteDataFetcher) {
        this.salesBarcodeService = salesBarcodeService;
        this.apiUserService = apiUserService;
        this.userService = userService;
        this.remoteDataFetcher = remoteDataFetcher;
    }

    private boolean isAuthInvalid(String username, String password, String shopcode) {
        return AspCommonFunctions.authUser(username, password, shopcode, apiUserService);
    }

    private boolean isLocalShop(String shopcode)
    {
        String defaultShop = userService.getdefaultshopcode();
        if (shopcode == null || defaultShop == null) return false;
        
        if (shopcode.equalsIgnoreCase(defaultShop)) return true;
        
        if (defaultShop.toUpperCase().startsWith(shopcode.toUpperCase() + ":")) return true;
        if (shopcode.toUpperCase().startsWith(defaultShop.toUpperCase() + ":")) return true;
        
        return false;
    }

    private ResponseEntity<?> invalidAuth()
    {
        return AspCommonFunctions.Invalid();
    }

    @PostMapping("/scan")
    @Operation(summary = "Scan and valida	te Barcode", description = "Validates the barcode and returns stock, stone, and validation fields.")
    public ResponseEntity<?> scanBarcode(
            @RequestBody SalesBarcodeRequest payload,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (!isLocalShop(shopcode)) 
        {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/api/sales/barcode/scan", HttpMethod.POST, payload, username, password);
        }
        if (isAuthInvalid(username, password, shopcode)) return invalidAuth();

        try {
            log.info("📥 [scanBarcode] Barcode: {}, EstNo: {}, User: {}, Shop: {}", payload.getBarcode(), payload.getEstNo(), username, shopcode);
            SalesBarcodeResponseDto result = salesBarcodeService.scanBarcode(payload);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("❌ [scanBarcode] Error: {}", e.getMessage());
            return ResponseEntity.status(500).body(java.util.Map.of("success", false, "warningMessage", e.getMessage()));
        }
    }
}
