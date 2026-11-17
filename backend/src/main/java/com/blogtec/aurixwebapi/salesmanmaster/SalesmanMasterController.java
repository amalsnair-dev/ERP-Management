package com.blogtec.aurixwebapi.salesmanmaster;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.dto.SalesmanMasterDto;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;

@RestController
@RequestMapping("/salesmanmaster")
@SuppressWarnings({ "unchecked", "rawtypes" })
public class SalesmanMasterController {

    private final SalesmanMasterService smanService;
    private final RemoteDataFetcher remoteFetcher;
    private final UserService userService;
    private final ApiUserService apiUserService;

    @Autowired
    public SalesmanMasterController(
            SalesmanMasterService smanService,
            RemoteDataFetcher remoteFetcher,
            UserService userService,
            ApiUserService apiUserService
    ) {
        this.smanService = smanService;
        this.remoteFetcher = remoteFetcher;
        this.userService = userService;
        this.apiUserService = apiUserService;
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

    private ResponseEntity<?> unauthorized() {
        return AspCommonFunctions.Invalid();
    }

    // ============================================================
    // 🔍 FIND ALL
    // ============================================================
    @Transactional(readOnly = true)
    @GetMapping("/findBySalesMan")
    public ResponseEntity<List<SalesmanMasterDto>> findShopcodeDetails(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return (ResponseEntity) unauthorized();
            }

            return ResponseEntity.ok(smanService.findShopCodeDetails());
        }

        ResponseEntity<List<SalesmanMasterDto>> response = remoteFetcher.fetchRemoteList(
                shopcode,
                "salesmanmaster/findBySalesMan",
                username,
                password,
                new ParameterizedTypeReference<List<SalesmanMasterDto>>() {}
        );

        return ResponseEntity.ok(response.getBody() != null ? response.getBody() : List.of());
    }

    // ============================================================
    // 🔍 FIND BY SMCODE
    // ============================================================
    @Transactional(readOnly = true)
    @GetMapping("/findBySmcode")
    public ResponseEntity<List<SalesmanMasterDto>> findBySmcode(
            @RequestParam("smcode") String smcode,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return (ResponseEntity) unauthorized();
            }

            return ResponseEntity.ok(smanService.findBySmcode(smcode));
        }

        String path = "salesmanmaster/findBySmcode?smcode=" +
                URLEncoder.encode(smcode, StandardCharsets.UTF_8);

        ResponseEntity<List<SalesmanMasterDto>> response = remoteFetcher.fetchRemoteList(
                shopcode,
                path,
                username,
                password,
                new ParameterizedTypeReference<List<SalesmanMasterDto>>() {}
        );

        return ResponseEntity.ok(response.getBody() != null ? response.getBody() : List.of());
    }

    // ============================================================
    // ✅ EXISTS CHECK
    // ============================================================
    @GetMapping("/existsBySmCode")
    public ResponseEntity<Boolean> existsBySmCode(
            @RequestParam("smcode") String smcode,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return (ResponseEntity<Boolean>) unauthorized();
            }

            return ResponseEntity.ok(smanService.existsBySmCode(smcode));
        }

        String path = "salesmanmaster/existsBySmCode?smcode=" +
                URLEncoder.encode(smcode, StandardCharsets.UTF_8);

        ResponseEntity<?> response = remoteFetcher.fetchRemoteObject(
                shopcode,
                path,
                HttpMethod.GET,
                null,
                username,
                password
        );

        Object body = response.getBody();
        Boolean exists = false;

        if (body instanceof Boolean b) {
            exists = b;
        } else if (body instanceof String s) {
            exists = s.equalsIgnoreCase("true") || s.equals("1");
        }

        return ResponseEntity.ok(exists);
    }
}