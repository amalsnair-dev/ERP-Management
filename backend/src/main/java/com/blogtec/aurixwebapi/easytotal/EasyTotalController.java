package com.blogtec.aurixwebapi.easytotal;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.dto.EasyTotalDto;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;

@RestController
@RequestMapping("/easytotal")
public class EasyTotalController {

    private final EasyTotalService easyTotalService;
    private final UserService userService;
    private final ApiUserService apiUserService;
    private final RemoteDataFetcher remoteDataFetcher;

    @Autowired
    public EasyTotalController(EasyTotalService easyTotalService,
                               UserService userService,
                               ApiUserService apiUserService,
                               RemoteDataFetcher remoteDataFetcher) {
        this.easyTotalService = easyTotalService;
        this.userService = userService;
        this.apiUserService = apiUserService;
        this.remoteDataFetcher = remoteDataFetcher;
    }

    // ============================================================
    // 🛡️ HELPERS
    // ============================================================
    private boolean isLocalShop(String shopcode) {
        return shopcode != null &&
               shopcode.equalsIgnoreCase(userService.getdefaultshopcode());
    }

    private boolean isAuthInvalid(String username, String password, String shopcode) {
        return AspCommonFunctions.authUser(username, password, shopcode, apiUserService);
    }

    // ============================================================
    // 📦 CACHE
    // ============================================================
    @Cacheable(value = "easyTotalCache", key = "'EASY_TOTAL'")
    public List<EasyTotalDto> getCachedEasyTotal() {
        return easyTotalService.getEasyTotal();
    }

    // ============================================================
    // 📡 API
    // ============================================================
    @GetMapping("/geteasytotal")
    public ResponseEntity<?> getEasyTotal(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        // ========================================================
        // 1️⃣ CHECK SHOP TYPE FIRST
        // ========================================================
        if (isLocalShop(shopcode)) {

            // ====================================================
            // 2️⃣ LOCAL SHOP → AUTH REQUIRED
            // ====================================================
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            // ====================================================
            // 3️⃣ RETURN LOCAL DATA (CACHED)
            // ====================================================
            return ResponseEntity.ok(getCachedEasyTotal());
        }

        // ========================================================
        // 4️⃣ REMOTE SHOP → SKIP LOCAL AUTH
        // ========================================================
        return remoteDataFetcher.fetchRemoteList(
                shopcode,
                "easytotal/geteasytotal",
                username,
                password,
                new ParameterizedTypeReference<List<EasyTotalDto>>() {}
        );
    }
}