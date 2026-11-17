package com.blogtec.aurixwebapi.sales;

import java.util.Map;

import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.dto.StoneMasterDto;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;

@RestController
public class SalesApiLookupController {

    private final SalesLookupService salesLookupService;
    private final ApiUserService apiUserService;
    private final RemoteDataFetcher remoteDataFetcher;
    private final UserService userService;

    public SalesApiLookupController(SalesLookupService salesLookupService,
            ApiUserService apiUserService,
            RemoteDataFetcher remoteDataFetcher,
            UserService userService) {
        this.salesLookupService = salesLookupService;
        this.apiUserService = apiUserService;
        this.remoteDataFetcher = remoteDataFetcher;
        this.userService = userService;
    }

    // ============================================================
    // 🛡️ AUTH
    // ============================================================
    private boolean isAuthInvalid(String username, String password, String shopcode) {
        return AspCommonFunctions.authUser(username, password, shopcode, apiUserService);
    }

    private boolean isLocalShop(String shopcode) {
        return shopcode != null &&
                shopcode.equalsIgnoreCase(userService.getdefaultshopcode());
    }

    // ============================================================
    // 🔹 STONES
    // ============================================================
    @GetMapping("/api/stones")
    public ResponseEntity<?> getAllStones(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/api/stones", HttpMethod.GET, null, username,
                    password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return AspCommonFunctions.Invalid();
        }

        // ✅ LOCAL EXECUTION
        return ResponseEntity.ok(salesLookupService.getAllStones());
    }

    // ============================================================
    // 🔹 STONE BY CODE
    // ============================================================
    @GetMapping({"/api/stones/{code}", "/api/stones/{code}/"})
    public ResponseEntity<?> getStoneByCode(
            @PathVariable String code,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/api/stones/" + code, HttpMethod.GET, null, username,
                    password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return AspCommonFunctions.Invalid();
        }

        // ✅ LOCAL EXECUTION
        StoneMasterDto stone = salesLookupService.getStoneByCode(code);
        return stone != null ? ResponseEntity.ok(stone) : ResponseEntity.notFound().build();
    }

    // ============================================================
    // 🔹 NEXT EST NO
    // ============================================================
    @GetMapping("/api/estno/next")
    public ResponseEntity<?> getNextEstNo(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/api/estno/next", HttpMethod.GET, null, username,
                    password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return AspCommonFunctions.Invalid();
        }

        // ✅ LOCAL EXECUTION
        return ResponseEntity.ok(salesLookupService.getNextEstNo());
    }

    // ============================================================
    // 🔹Estimate lookup popup api
    // ============================================================
    @GetMapping("/api/sales-entries/search/metal")
    public ResponseEntity<?> searchByMetal(
            @RequestParam("metalType") String metalType,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // 1. ROUTE / VALIDATE SHOP (Optional but recommended for your architecture)
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode,
                    "/api/sales-entries/search/metal?metalType=" + metalType + "&shopcode=" + shopcode,
                    HttpMethod.GET, null, username, password);
        }

        // 2. AUTH
        if (isAuthInvalid(username, password, shopcode)) {
            return AspCommonFunctions.Invalid();
        }

        // 3. EXECUTE
        return ResponseEntity.ok(salesLookupService.searchByMetal(metalType));
    }

    // ============================================================
    // 🔹search by estno (estimate click)
    // ============================================================

    @GetMapping("/api/sales-entries/{estNo}")
    public ResponseEntity<?> getEstimateByEstNo(
            @PathVariable Integer estNo,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // 1. ROUTE Evaluate
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode,
                    "/api/sales-entries/" + estNo + "?shopcode=" + shopcode,
                    HttpMethod.GET, null, username, password);
        }

        // 2. AUTHENTICATE local user
        if (isAuthInvalid(username, password, shopcode)) {
            return AspCommonFunctions.Invalid();
        }

        // 3. EXECUTE SERVICE (already exists in your SalesLookupService)
        Map<String, Object> result = salesLookupService.getEstimateByEstNo(estNo);
        return result != null ? ResponseEntity.ok(result) : ResponseEntity.notFound().build();
    }

    // ============================================================
    // 🔹 SEARCH BARCODE
    // ============================================================
    @GetMapping("/api/sales-entries/search/barcode")
    public ResponseEntity<?> searchByBarcode(
            @RequestParam("barcode") String barcode,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode,
                    "/api/sales-entries/search/barcode?barcode=" + barcode,
                    HttpMethod.GET,
                    null,
                    username,
                    password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return AspCommonFunctions.Invalid();
        }

        // ✅ LOCAL EXECUTION
        Map<String, Object> result = salesLookupService.searchByBarcode(barcode);

        return result != null
                ? ResponseEntity.ok(result)
                : ResponseEntity.status(404).body(Map.of("error", "Barcode not found"));
    }
}
