package com.blogtec.aurixwebapi.careoff;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;
import com.blogtec.aurixwebapi.dto.CareOfMasterDto;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

@RestController
@RequestMapping("/careof")
public class CareOfController {

    private final CareOfService careOfService;
    private final ApiUserService apiUserService;
    private final UserService userService;
    private final RemoteDataFetcher remoteDataFetcher;

    @Autowired
    public CareOfController(
            CareOfService careOfService,
            ApiUserService apiUserService,
            UserService userService,
            RemoteDataFetcher remoteDataFetcher) {

        this.careOfService = careOfService;
        this.apiUserService = apiUserService;
        this.userService = userService;
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
    // GET ALL CAREOF
    // ============================================================
    @GetMapping("/all")
    public ResponseEntity<?> getAllCareOf(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {

            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            return ResponseEntity.ok(careOfService.findAllCareOf());
        }

        return remoteDataFetcher.fetchRemoteList(
                shopcode,
                "careof/all",
                username,
                password,
                new ParameterizedTypeReference<List<CareOfMasterDto>>() {});
    }

    // ============================================================
    // CHECK CAREOF CODE
    // ============================================================
    @GetMapping("/check")
    public ResponseEntity<?> checkCareOfCode(
            @RequestParam("careofcode") String careofcode,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {

            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            Optional<String> result = careOfService.findCareOfCode(careofcode);
            
            if (result.isPresent()) {
                 return ResponseEntity.ok(Map.of("careofcode", result.get()));
            } else {
                 return ResponseEntity.ok(Map.of("careofcode", ""));
            }
        }

        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                "careof/check?careofcode=" + careofcode,
                HttpMethod.GET,
                null,
                username,
                password);
    }
}
