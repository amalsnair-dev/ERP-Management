package com.blogtec.aurixwebapi.sales;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpMethod;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;
import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;
import com.blogtec.aurixwebapi.payload.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/salesentry")
@Tag(name = "Sales Entry Controller", description = "Handles modular sales entry operations (Header, Items, Salesmen, Stones).")
public class SalesEntryController {

    private final SalesEntryService salesEntryService;
    private final ApiUserService apiUserService;
    private final UserService userService;
    private final RemoteDataFetcher remoteDataFetcher;
    private static final Logger log = LoggerFactory.getLogger(SalesEntryController.class);

    public SalesEntryController(SalesEntryService salesEntryService,
                                ApiUserService apiUserService,
                                UserService userService,
                                RemoteDataFetcher remoteDataFetcher) {
        this.salesEntryService = salesEntryService;
        this.apiUserService = apiUserService;
        this.userService = userService;
        this.remoteDataFetcher = remoteDataFetcher;
    }

    // ============================================================
    // 🛡️ AUTH & SHOP HELPERS
    // ============================================================
    private boolean isAuthInvalid(String username, String password, String shopcode) {
        return AspCommonFunctions.authUser(username, password, shopcode, apiUserService);
    }

    private boolean isLocalShop(String shopcode) {
        String defaultShop = userService.getdefaultshopcode();
        if (shopcode == null || defaultShop == null) return false;
        
        if (shopcode.equalsIgnoreCase(defaultShop)) return true;
        
        // Match branch variations if any
        if (defaultShop.toUpperCase().startsWith(shopcode.toUpperCase() + ":")) return true;
        if (shopcode.toUpperCase().startsWith(defaultShop.toUpperCase() + ":")) return true;
        
        return false;
    }

    private ResponseEntity<?> invalidAuth() {
        return AspCommonFunctions.Invalid();
    }

    // ============================================================
    // 🧩 MODULAR SAVES
    // ============================================================

    @PostMapping("/saveGeneral")
    @Operation(summary = "Save General Details", description = "Saves only the EstMstr header details.")
    public ResponseEntity<?> saveGeneral(
            @RequestBody SalesGeneralPayload payload,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/salesentry/saveGeneral", HttpMethod.POST, payload, username, password);
        }
        if (isAuthInvalid(username, password, shopcode)) return invalidAuth();

        try {
            log.info("📥 [saveGeneral] EstNo: {}, User: {}, Shop: {}", payload.getEstNo(), username, shopcode);
            log.info("🔍 [saveGeneral] Aadhar: {}, PAN: {}, GST: {}", payload.getAadharno(), payload.getPanno(), payload.getGstno());
            payload.setShopcode(shopcode);
            salesEntryService.saveGeneralDetails(payload);
            return ResponseEntity.ok(Map.of("status", "success", "message", "General details saved"));
        } catch (Exception e) {
            log.error("❌ [saveGeneral] Error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @PostMapping("/saveSales")
    @Operation(summary = "Save Sales Items", description = "Saves only the item list to Saleest.")
    public ResponseEntity<?> saveSales(
            @RequestBody SalesItemsPayload payload,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/salesentry/saveSales", HttpMethod.POST, payload, username, password);
        }
        if (isAuthInvalid(username, password, shopcode)) return invalidAuth();

        try {
            log.info("📥 [saveSales] EstNo: {}, Items: {}, User: {}, Shop: {}", payload.getEstNo(), (payload.getSaleItems() != null ? payload.getSaleItems().size() : 0), username, shopcode);
            salesEntryService.saveSalesDetails(payload);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Sales items saved"));
        } catch (Exception e) {
            log.error("❌ [saveSales] Error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @PostMapping("/saveSman")
    @Operation(summary = "Save Salesman Details", description = "Saves only the salesman data to salesmanbilldata.")
    public ResponseEntity<?> saveSman(
            @RequestBody SalesSmanPayload payload,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/salesentry/saveSman", HttpMethod.POST, payload, username, password);
        }
        if (isAuthInvalid(username, password, shopcode)) return invalidAuth();

        try {
            log.info("📥 [saveSman] EstNo: {}, Sman1: {}, User: {}, Shop: {}", payload.getEstNo(), payload.getEstSman1(), username, shopcode);
            salesEntryService.saveSmanDetails(payload);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Salesman details saved"));
        } catch (Exception e) {
            log.error("❌ [saveSman] Error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @PostMapping("/saveStone")
    @Operation(summary = "Save Stone Details", description = "Saves only the stone entries for specific items.")
    public ResponseEntity<?> saveStone(
            @RequestBody SalesStonePayload payload,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/salesentry/saveStone", HttpMethod.POST, payload, username, password);
        }
        if (isAuthInvalid(username, password, shopcode)) return invalidAuth();

        try {
            log.info("📥 [saveStone] EstNo: {}, Stones: {}, User: {}, Shop: {}", payload.getEstNo(), (payload.getStoneEntries() != null ? payload.getStoneEntries().size() : 0), username, shopcode);
            salesEntryService.saveStoneDetails(payload);
            salesEntryService.updateStoneRates(payload.getEstNo());
            return ResponseEntity.ok(Map.of("status", "success", "message", "Stone details saved"));
        } catch (Exception e) {
            log.error("❌ [saveStone] Error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @PostMapping("/savePurchase")
    @Operation(summary = "Save purchase details (pureest)", description = "Saves or updates purchase estimate items for a given estimate number.")
    public ResponseEntity<?> savePurchaseDetails(
            @RequestBody SalesPureestPayload payload,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/salesentry/savePurchase", HttpMethod.POST, payload, username, password);
        }
        if (isAuthInvalid(username, password, shopcode)) return invalidAuth();

        try {
            log.info("📥 [savePurchase] EstNo: {}, Items: {}, User: {}, Shop: {}", payload.getEstNo(), (payload.getPurchaseItems() != null ? payload.getPurchaseItems().size() : 0), username, shopcode);
            salesEntryService.savePureestDetails(payload);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Purchase details saved successfully"));
        } catch (Exception e) {
            log.error("❌ [savePurchase] Error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @PostMapping("/saveAdvance")
    @Operation(summary = "Save advance details (saleadvest)", description = "Saves or updates advance adjustment items for a given estimate number.")
    public ResponseEntity<?> saveAdvanceDetails(
            @RequestBody SalesAdvestPayload payload,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/salesentry/saveAdvance", HttpMethod.POST, payload, username, password);
        }
        if (isAuthInvalid(username, password, shopcode)) return invalidAuth();

        try {
            log.info("📥 [saveAdvance] EstNo: {}, Items: {}, User: {}, Shop: {}", payload.getEstNo(), (payload.getAdvanceItems() != null ? payload.getAdvanceItems().size() : 0), username, shopcode);
            salesEntryService.saveAdvestDetails(payload);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Advance details saved successfully"));
        } catch (Exception e) {
            log.error("❌ [saveAdvance] Error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @PostMapping("/saveCreditNote")
    @Operation(summary = "Save credit note details (crnest)", description = "Saves or updates credit note adjustment items for a given estimate number by copying from billed transaction data.")
    public ResponseEntity<?> saveCreditNoteDetails(
            @RequestBody SalesCrnPayload payload,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/salesentry/saveCreditNote", HttpMethod.POST, payload, username, password);
        }
        if (isAuthInvalid(username, password, shopcode)) return invalidAuth();

        try {
            log.info("📥 [saveCreditNote] EstNo: {}, Items: {}, User: {}, Shop: {}", payload.getEstNo(), (payload.getCreditItems() != null ? payload.getCreditItems().size() : 0), username, shopcode);
            salesEntryService.saveCreditNoteDetails(payload);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Credit Note details saved successfully"));
        } catch (Exception e) {
            log.error("❌ [saveCreditNote] Error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
    
    @PostMapping("/create")
    public ResponseEntity<Integer> createSalesEntry(
            @RequestBody CreateSalesEntryPayload payload,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        Integer estNo = salesEntryService.createSalesEntry(payload);

        return ResponseEntity.ok(estNo);
    }
    
}
