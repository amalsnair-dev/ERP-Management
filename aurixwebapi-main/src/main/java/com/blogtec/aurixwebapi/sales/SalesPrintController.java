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

@RestController
@RequestMapping("/salesprint")
@Tag(name = "Sales Print Controller API", description = "Sales Print related APIs")
public class SalesPrintController {

    private final SalesPrintServices service;
    private final ApiUserService apiUserService;
    private final UserService userService;
    private final RemoteDataFetcher remoteDataFetcher;

    public SalesPrintController(
            SalesPrintServices service,
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
    // SALES REPORT THERMAL/ESTIMATE PRINT TEXT
    // ============================================================
    @GetMapping("report/{estNo}")
    public ResponseEntity<?> print(
            @PathVariable Long estNo,
            @RequestParam(defaultValue = "E") String type,
            @RequestParam(value = "shopcode", required = false) String shopcodeParam,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        String shopcode = (shopcodeParam != null) ? shopcodeParam : userService.getdefaultshopcode();

        // ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, "/salesprint/report/" + estNo + "?type=" + type, HttpMethod.GET, null, username, password);
        }

        // AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        if (!type.equalsIgnoreCase("T") && !type.equalsIgnoreCase("E")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid type (Use T or E)"));
        }

        String report = service.print(estNo, type);
        return ResponseEntity.ok(Map.of(
            "message", "Success",
            "printData", report
        ));
    }
}
