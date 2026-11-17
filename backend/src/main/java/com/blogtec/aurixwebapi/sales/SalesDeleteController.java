package com.blogtec.aurixwebapi.sales;

import java.util.Map;

import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/salesdelete")
@Tag(name = "Sales Delete Controller API", description = "Sales Delete related APIs")
public class SalesDeleteController {

    private static final Logger logger = LoggerFactory.getLogger(SalesDeleteController.class);
    private final SalesDeleteService service;
    private final ApiUserService apiUserService;
    private final UserService userService;
    private final RemoteDataFetcher remoteDataFetcher;

    public SalesDeleteController(
            SalesDeleteService service,
            ApiUserService apiUserService,
            UserService userService,
            RemoteDataFetcher remoteDataFetcher) {
        this.service = service;
        this.apiUserService = apiUserService;
        this.userService = userService;
        this.remoteDataFetcher = remoteDataFetcher;
    }

    // ============================================================
    // 🛡️ AUTH HELPERS
    // ============================================================
    private boolean isAuthInvalid(String username, String password, String shopcode) {
        return AspCommonFunctions.authUser(username, password, shopcode, apiUserService);
    }

    private boolean isLocalShop(String shopcode) {
        return shopcode == null || shopcode.isBlank() ||
                shopcode.equalsIgnoreCase(userService.getdefaultshopcode());
    }

    private ResponseEntity<?> invalidAuth() {
        return AspCommonFunctions.Invalid();
    }

    private ResponseEntity<?> parseAndReturnJson(String response, String fallbackMessage) {
        if (response != null && !response.trim().isEmpty()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(response);
                
                if (root.isArray()) {
                    if (root.size() > 0) {
                        return ResponseEntity.ok(root.get(0));
                    }
                } else if (root.isObject()) {
                    return ResponseEntity.ok(root);
                } else {
                    return ResponseEntity.ok(root);
                }
            } catch (Exception e) {
                return ResponseEntity.ok(response);
            }
        }
        
        return ResponseEntity.ok(Map.of("message", fallbackMessage));
    }

    // ============================================================
    // ✅ STEP 2: DELETE API
    // ============================================================
    @DeleteMapping("/delete/{estNo}")
    public ResponseEntity<?> deleteEstimate(
            @PathVariable Long estNo,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null) ? shopcodeParam : userService.getdefaultshopcode();

        // 1️⃣ Route to remote shop if needed
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, "/salesdelete/delete/" + estNo,
                    HttpMethod.DELETE, null, username, password);
        }

        // 2️⃣ Auth check
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        try {
            String result = service.deleteEstimate(estNo);
            // Normalise result to a JSON map for the front‑end
            return ResponseEntity.ok(java.util.Map.of("status", result));
        } catch (Exception ex) {
            // Log the exception (could be a FK violation, DB error, etc.)
            logger.error("Delete estimate failed for estNo {}: {}", estNo, ex.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of(
                            "error", "Delete failed",
                            "details", ex.getMessage()));
        }
    }

    // ============================================================
    // ✅ STEP 3: DELETE SALESMAN DATA
    // ============================================================
    @DeleteMapping("/salesman/delete/{estNo}")
    public ResponseEntity<?> deleteSalesman(
            @PathVariable Long estNo,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null) ? shopcodeParam : userService.getdefaultshopcode();

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, "/salesdelete/salesman/delete/" + estNo, HttpMethod.DELETE, null, username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        String result = service.deleteSalesman(estNo);
        return parseAndReturnJson(result, "Delete salesman failed");
    }

    // ============================================================
    // ✅ STEP 4: VERIFY PASSWORD
    // ============================================================
    @PostMapping("/verify-password")
    public ResponseEntity<?> verifyPassword(
            @RequestParam String code,
            @RequestParam String inputPassword,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null) ? shopcodeParam : userService.getdefaultshopcode();

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, "/salesdelete/verify-password?code=" + code + "&inputPassword=" + inputPassword, 
                    HttpMethod.POST, null, username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        boolean isValid = service.verifyPassword(code, inputPassword);
        return ResponseEntity.ok(Map.of("isValid", isValid));
    }
}