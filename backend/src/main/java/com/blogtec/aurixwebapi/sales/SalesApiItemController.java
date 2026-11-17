package com.blogtec.aurixwebapi.sales;

import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.dto.ItemMasterDto;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;

@RestController
@RequestMapping("/api/items")
public class SalesApiItemController {

    private final SalesItemService salesItemService;
    private final ApiUserService apiUserService;
    private final RemoteDataFetcher remoteDataFetcher;
    private final UserService userService;

    public SalesApiItemController(SalesItemService salesItemService,
            ApiUserService apiUserService,
            RemoteDataFetcher remoteDataFetcher,
            UserService userService) {
        this.salesItemService = salesItemService;
        this.apiUserService = apiUserService;
        this.remoteDataFetcher = remoteDataFetcher;
        this.userService = userService;
    }

    // ============================================================
    // 🛡️ AUTH HELPERS
    // ============================================================
    private boolean isAuthInvalid(String username, String password, String shopcode) {
        return AspCommonFunctions.authUser(username, password, shopcode, apiUserService);
    }

    private boolean isLocalShop(String shopcode) {
        return shopcode != null &&
                shopcode.equalsIgnoreCase(userService.getdefaultshopcode());
    }

    // ============================================================
    // 📦 GET ITEMS
    // ============================================================
    @GetMapping
    public ResponseEntity<?> getItems(
            @RequestParam(required = false) String metalType,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            String path = "/api/items" + (metalType != null ? "?metalType=" + metalType : "");
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, path, HttpMethod.GET, null, username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return AspCommonFunctions.Invalid();
        }

        // ✅ LOCAL EXECUTION
        try {
            return ResponseEntity.ok(salesItemService.getItems(metalType));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error fetching items: " + e.getMessage());
        }
    }

    // ============================================================
    // 🔍 GET ITEM BY CODE
    // ============================================================
    @GetMapping("/{itemCode}")
    public ResponseEntity<?> getItemByCode(
            @PathVariable String itemCode,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/api/items/" + itemCode, HttpMethod.GET, null,
                    username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return AspCommonFunctions.Invalid();
        }

        // ✅ LOCAL EXECUTION
        try {
            ItemMasterDto item = salesItemService.getItemByCode(itemCode);
            return item != null
                    ? ResponseEntity.ok(item)
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error: " + e.getMessage());
        }
    }

    // ============================================================
    // 💰 GOLD RATE BY ITEM
    // ============================================================
    @GetMapping("/{itemCode}/gold-rate")
    public ResponseEntity<?> getGoldRateByItemCode(
            @PathVariable String itemCode,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/api/items/" + itemCode + "/gold-rate",
                    HttpMethod.GET, null, username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return AspCommonFunctions.Invalid();
        }

        // ✅ LOCAL EXECUTION
        try {
            return ResponseEntity.ok(
                    salesItemService.getGoldRateByItemCode(itemCode));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ============================================================
    // 📊 TODAY GOLD RATE
    // ============================================================
    @GetMapping("/gold-rate/today")
    public ResponseEntity<?> getTodayGoldRate(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/api/items/gold-rate/today", HttpMethod.GET, null,
                    username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return AspCommonFunctions.Invalid();
        }

        // ✅ LOCAL EXECUTION
        try {
            return ResponseEntity.ok(salesItemService.getTodayGoldRate());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ============================================================
    // 📊 LATEST GOLD/SILVER RATES (916, 75, SLV)
    // ============================================================
    @GetMapping("/rates/latest")
    public ResponseEntity<?> getLatestRates(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/api/items/rates/latest", HttpMethod.GET, null,
                    username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return AspCommonFunctions.Invalid();
        }

        // ✅ LOCAL EXECUTION
        return ResponseEntity.ok(salesItemService.getLatestRates());
    }

    // ============================================================
    // 📊 DUPLICATE RATE CHECK
    // ============================================================
    @GetMapping("/rates/check-duplicate")
    public ResponseEntity<?> isDuplicateRate(
            @RequestParam("g916") double g916,
            @RequestParam("g75") double g75,
            @RequestParam("slv") double slv,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            String path = String.format("/api/items/rates/check-duplicate?g916=%f&g75=%f&slv=%f", g916, g75, slv);
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, path, HttpMethod.GET, null, username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return AspCommonFunctions.Invalid();
        }

        // ✅ LOCAL EXECUTION
        boolean isDup = salesItemService.isDuplicateRate(g916, g75, slv);
        return ResponseEntity.ok(isDup);
    }

    // ============================================================
    // 👤 GET SALESMAN BILL DATA
    // ============================================================
    @GetMapping("/salesman/{estNo}")
    public ResponseEntity<?> getSalesmanDetails(
            @PathVariable Long estNo,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/api/items/salesman/" + estNo, HttpMethod.GET, null,
                    username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return AspCommonFunctions.Invalid();
        }

        // ✅ LOCAL EXECUTION
        try {
            return ResponseEntity.ok(salesItemService.getSalesmanDetails(estNo));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error fetching salesman details: " + e.getMessage());
        }
    }
}
