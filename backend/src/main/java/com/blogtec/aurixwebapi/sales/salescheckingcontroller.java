package com.blogtec.aurixwebapi.sales;

import java.util.List;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;

import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/saleschecking")
@Tag(name = "Sales Checking Controller API", description = "Sales Checking related APIs")
public class salescheckingcontroller {

    private final salescheckingServices service;
    private final ApiUserService apiUserService;
    private final UserService userService;
    private final RemoteDataFetcher remoteDataFetcher;

    public salescheckingcontroller(
            salescheckingServices service,
            ApiUserService apiUserService,
            UserService userService,
            RemoteDataFetcher remoteDataFetcher) {
        this.service = service;
        this.apiUserService = apiUserService;
        this.userService = userService;
        this.remoteDataFetcher = remoteDataFetcher;
    }

    // ============================================================
    // AUTH HELPERS
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

    // ============================================================
    // DIAMOND ITEM CHECK
    // ============================================================
    @GetMapping("/dmditemcheck/{item}")
    public ResponseEntity<?> checkDiamondItem(
            @PathVariable("item") String item,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null) ? shopcodeParam : userService.getdefaultshopcode();

        // ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, "/saleschecking/dmditemcheck/" + item, HttpMethod.GET, null, username, password);
        }

        // AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        boolean isDiamond = service.isDiamondItem(item);

        return ResponseEntity.ok(isDiamond);
    }

    @GetMapping("/itemcheck/{item}")
    public ResponseEntity<?> checkItem(
            @PathVariable("item") String item,
            @RequestParam(value = "metalType", required = false) String metalType,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null) ? shopcodeParam : userService.getdefaultshopcode();

        // ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            String path = "/saleschecking/itemcheck/" + item;
            if (metalType != null) {
                path += "?metalType=" + metalType;
            }
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, path, HttpMethod.GET, null, username, password);
        }

        // AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        boolean isItem = service.isItem(item, metalType);

        return ResponseEntity.ok(isItem);
    }

    @GetMapping("/barWtDiffLimit/{item}")
    public ResponseEntity<?> barWtDiffLimit(
            @PathVariable("item") String item,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null) ? shopcodeParam : userService.getdefaultshopcode();

        // ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, "/saleschecking/barWtDiffLimit", HttpMethod.GET, null, username, password);
        }

        // AUTH SECOND
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        Double amount = service.barWtDiffLimit();

        return ResponseEntity.ok(amount);
    }

    @GetMapping("/getQty")
    public ResponseEntity<?> getQty(
            @RequestParam("barcode") String barcode,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null)
                ? shopcodeParam
                : userService.getdefaultshopcode();

        // 🔁 ROUTE FIRST (Remote Call)
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode,
                    "/saleschecking/getQty?barcode=" + barcode,
                    HttpMethod.GET,
                    null,
                    username,
                    password);
        }

        // 🔐 AUTH SECOND
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        // 📦 LOCAL DB CALL
        Integer qty = service.getQtyByBarcode(barcode);

        return ResponseEntity.ok(qty);
    }

    // ============================================================
    // EST_NO CHECKING BY GOLD_SLV
    // ============================================================
    @GetMapping("/estenochecking/{goldSlv}")
    public ResponseEntity<?> getDistinctEstNos(
            @PathVariable("goldSlv") String goldSlv,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null) ? shopcodeParam : userService.getdefaultshopcode();

        // ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, "/saleschecking/estenochecking/" + goldSlv, HttpMethod.GET, null, username, password);
        }

        // AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        List<String> estNos = service.getDistinctEstNos(goldSlv);

        return ResponseEntity.ok(estNos);
    }

    // ============================================================
    // STOCK TRANSFER CHECK (RECEIVE)
    // ============================================================
    @GetMapping("/stocktransfercheck/receive/{barcode}")
    public ResponseEntity<?> checkStockReceive(
            @PathVariable("barcode") String barcode,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null) ? shopcodeParam : userService.getdefaultshopcode();

        // ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, "/saleschecking/stocktransfercheck/receive/" + barcode, HttpMethod.GET, null, username,
                    password);
        }

        // AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        boolean exists = service.checkStockReceive(barcode, shopcode);

        return ResponseEntity.ok(exists);
    }

    // ============================================================
    // STOCK TRANSFER CHECK (TRANSFER)
    // ============================================================
    @GetMapping("/stocktransfercheck/transfer/{barcode}")
    public ResponseEntity<?> checkStockTransfer(
            @PathVariable("barcode") String barcode,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null) ? shopcodeParam : userService.getdefaultshopcode();

        // ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, "/saleschecking/stocktransfercheck/transfer/" + barcode, HttpMethod.GET, null, username,
                    password);
        }

        // AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        boolean exists = service.checkStockTransfer(barcode, shopcode);

        return ResponseEntity.ok(exists);
    }

    // ============================================================
    // ESTIMATE EXISTENCE CHECK
    // ============================================================
    @GetMapping("/exists/{estNo}")
    public ResponseEntity<?> checkEstimateExists(
            @PathVariable("estNo") int estNo,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null) ? shopcodeParam : userService.getdefaultshopcode();

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, "/saleschecking/exists/" + estNo, HttpMethod.GET, null, username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        boolean exists = service.existsByEstNo(estNo);

        return ResponseEntity.ok(exists);
    }

    @GetMapping({ "/stone/{code}" })
    public ResponseEntity<?> getStoneByCode(
            @PathVariable("code") String code,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null) ? shopcodeParam : userService.getdefaultshopcode();

        // 🔀 ROUTE FIRST (if remote)
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, "/saleschecking/stone/" + code, HttpMethod.GET, null, username, password);
        }

        // 🔐 AUTH SECOND
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        // 📦 LOCAL DB CALL
        boolean exists = service.getStoneByCode(code);

        return ResponseEntity.ok(exists);
    }

    @GetMapping("/min-va-check")
    public ResponseEntity<?> minVaSalesChecking(
            @RequestParam("itemCode") String itemCode,
            @RequestParam("va") Double va,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null) ? shopcodeParam : userService.getdefaultshopcode();

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            String path = String.format("/saleschecking/min-va-check?itemCode=%s&va=%f", itemCode, va);
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, path, HttpMethod.GET, null, username, password);
        }

        // 🔐 AUTH SECOND
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        // 📦 LOCAL DB CALL
        boolean result = service.minVaSalesChecking(itemCode, va);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/check-estimate/{estNo}")
    public ResponseEntity<?> checkEstimate(
            @PathVariable("estNo") Long estNo,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null) ? shopcodeParam : userService.getdefaultshopcode();

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, "/saleschecking/check-estimate/" + estNo, HttpMethod.GET, null, username, password);
        }

        // 🔐 AUTH SECOND
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        // 📦 LOCAL DB CALL
        String status = service.checkEstimate(estNo);

        return ResponseEntity.ok(status);
    }
}
