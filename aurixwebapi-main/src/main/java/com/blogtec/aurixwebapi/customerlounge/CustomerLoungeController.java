package com.blogtec.aurixwebapi.customerlounge;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.dto.CategoryForCustomerDto;
import com.blogtec.aurixwebapi.dto.getDesginDTO;
import com.blogtec.aurixwebapi.dto.getSubdesginDTO;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;

@RestController
@RequestMapping("/customerlounge")
public class CustomerLoungeController {

    private final CustomerLoungeService service;
    private final UserService userService;
    private final ApiUserService apiUserService;
    private final RemoteDataFetcher remoteDataFetcher;

    @Autowired
    public CustomerLoungeController(
            CustomerLoungeService service,
            UserService userService,
            ApiUserService apiUserService,
            RemoteDataFetcher remoteDataFetcher) {

        this.service = service;
        this.userService = userService;
        this.apiUserService = apiUserService;
        this.remoteDataFetcher = remoteDataFetcher;
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

    private ResponseEntity<?> invalidAuth() {
        return AspCommonFunctions.Invalid();
    }

    // ============================================================
    // 1️⃣ CATEGORY LIST
    // ============================================================
    @GetMapping("/getCategoryForCustomer")
    public ResponseEntity<?> getCategoryForCustomer(
            @RequestParam("shopcode") String shopcode) {

        if (isLocalShop(shopcode)) {
            return ResponseEntity.ok(service.getCategoryForCustomer(shopcode));
        }

        return remoteDataFetcher.fetchRemoteList(
                shopcode,
                "/customerlounge/getCategoryForCustomer",
                new ParameterizedTypeReference<List<CategoryForCustomerDto>>() {
                });
    }

    // ============================================================
    // 2️⃣ DESIGN LIST
    // ============================================================
    @GetMapping("/getDesignList")
    public ResponseEntity<?> getDesignList(
            @RequestParam("category") String category,
            @RequestParam("shopcode") String shopcode) {

        if (isLocalShop(shopcode)) {
            return ResponseEntity.ok(service.getDesignList(category));
        }

        return remoteDataFetcher.fetchRemoteList(
                shopcode,
                "/customerlounge/getDesignList?category=" + category,
                new ParameterizedTypeReference<List<getDesginDTO>>() {
                });
    }

    // ============================================================
    // 3️⃣ SUB DESIGN LIST
    // ============================================================
    @GetMapping("/getSubDesignList")
    public ResponseEntity<?> getSubDesignList(
            @RequestParam("designcode") Integer designcode,
            @RequestParam("shopcode") String shopcode) {

        if (isLocalShop(shopcode)) {
            return ResponseEntity.ok(service.getSubDesignList(designcode));
        }

        return remoteDataFetcher.fetchRemoteList(
                shopcode,
                "/customerlounge/getSubDesignList?designcode=" + designcode,
                new ParameterizedTypeReference<List<getSubdesginDTO>>() {
                });
    }

    // ============================================================
    // 4️⃣ BARCODE LIST
    // ============================================================
    @GetMapping("/getBarcodeList")
    public ResponseEntity<?> getBarcodeList(
            @RequestParam("subdesign") String subdesign,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(
                    shopcode,
                    "/customerlounge/getBarcodeList?subdesign=" + AspCommonFunctions.encode(subdesign),
                    HttpMethod.GET,
                    null,
                    username,
                    password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        // ✅ LOCAL EXECUTION
        return ResponseEntity.ok(service.getBarcodeList(subdesign));
    }

    // ============================================================
    // 5️⃣ BARCODE DETAILS
    // ============================================================
    @GetMapping("/getDetailedBarcodeData")
    public ResponseEntity<?> getDetailedCustomerData(
            @RequestParam("dsgnname") String dsgnname,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

      

        // 🔀 ROUTE first
        if (isLocalShop(shopcode)) {
        	
        	  // 🔐 AUTH second (GLOBAL)
            if (isAuthInvalid(username, password, shopcode)) {
                return invalidAuth();
            }
            return ResponseEntity.ok(
                    service.getDetailedReportForCustomer(dsgnname, shopcode));
        }

        String url = "/customerlounge/getDetailedBarcodeData"
                + "?dsgnname=" + AspCommonFunctions.encode(dsgnname)
                + "&shopcode=" + AspCommonFunctions.encode(shopcode);

        return remoteDataFetcher.fetchRemoteRawJson(
                shopcode,
                url,
                HttpMethod.GET,
                null,
                username,
                password);
    }
}