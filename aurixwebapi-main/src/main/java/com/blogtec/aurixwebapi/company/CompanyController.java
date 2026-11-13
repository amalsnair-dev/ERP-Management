package com.blogtec.aurixwebapi.company;

import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;
import org.springframework.http.HttpMethod;
import java.util.Map;

@RestController
@RequestMapping("/company")
public class CompanyController {

    private final CompanyService companyService;
    private final UserService userService;
    private final ApiUserService apiUserService;
    private final RemoteDataFetcher remoteDataFetcher;

    @Autowired
    public CompanyController(CompanyService companyService,
            UserService userService,
            ApiUserService apiUserService,
            RemoteDataFetcher remoteDataFetcher) {
        this.companyService = companyService;
        this.userService = userService;
        this.apiUserService = apiUserService;
        this.remoteDataFetcher = remoteDataFetcher;
    }

    // ============================================================
    // 🛡️ AUTH & SHOP HELPERS
    // ============================================================
    private boolean isAuthInvalid(String username, String password, String shopcode) {
        return AspCommonFunctions.authUser(username, password, shopcode, apiUserService);
    }

    private boolean isLocalShop(String shopcode) {
        return shopcode != null && shopcode.equalsIgnoreCase(userService.getdefaultshopcode());
    }

    // ============================================================
    // 🖼 COMPANY IMAGES
    // ============================================================
    @GetMapping("/images")
    public ResponseEntity<?> getImages(
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/company/images", HttpMethod.GET, null,
                    username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode))
            return AspCommonFunctions.Invalid();

        // ✅ LOCAL EXECUTION
        return ResponseEntity.ok(companyService.getAllImages());
    }

    // ============================================================
    // 🏢 COMPANY DETAILS
    // ============================================================
    @GetMapping("/details")
    public ResponseEntity<?> getDetails(
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/company/details", HttpMethod.GET, null,
                    username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode))
            return AspCommonFunctions.Invalid();

        // ✅ LOCAL EXECUTION
        return ResponseEntity.ok(companyService.getCompanyDetails());
    }

    @PostMapping("/reset/{estno}")
    public ResponseEntity<?> resetVaDetails(
            @PathVariable String estno,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteRawJson(shopcode, "/company/reset/" + estno, HttpMethod.POST, null,
                    username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode))
            return AspCommonFunctions.Invalid();

        // ✅ LOCAL EXECUTION
        companyService.resetVadetails(estno);
        return ResponseEntity.ok(Map.of("message", "Reset completed for " + estno));
    }
}