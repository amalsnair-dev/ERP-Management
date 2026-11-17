package com.blogtec.aurixwebapi.giftmaster;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;
import com.blogtec.aurixwebapi.dto.GiftMasterDto;
import com.blogtec.aurixwebapi.dto.GiftLookupDto;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

@RestController
@RequestMapping("/giftmaster")
public class GiftMasterController {

    private final GiftMasterService giftMasterService;
    private final ApiUserService apiUserService;
    private final UserService userService;
    private final RemoteDataFetcher remoteDataFetcher;

    @Autowired
    public GiftMasterController(
            GiftMasterService giftMasterService,
            ApiUserService apiUserService,
            UserService userService,
            RemoteDataFetcher remoteDataFetcher) {
        this.giftMasterService = giftMasterService;
        this.apiUserService = apiUserService;
        this.userService = userService;
        this.remoteDataFetcher = remoteDataFetcher;
    }

    // ============================================================
    // 🛡️ HELPERS
    // ============================================================
    private boolean isLocalShop(String shopcode) {
        return shopcode != null && shopcode.equalsIgnoreCase(userService.getdefaultshopcode());
    }

    private boolean isAuthInvalid(String username, String password, String shopcode) {
        return AspCommonFunctions.authUser(username, password, shopcode, apiUserService);
    }

    // ============================================================
    // 🔨 CREATE TABLE
    // ============================================================
    @PostMapping("/create-table")
    public ResponseEntity<?> createTable(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }
            giftMasterService.createTable();
            return ResponseEntity.ok("gift_master table checked/created successfully!");
        }

        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                "giftmaster/create-table",
                HttpMethod.POST,
                null,
                username,
                password);
    }

    // ============================================================
    // ➕ SAVE GIFT
    // ============================================================
    @PostMapping("/save")
    public ResponseEntity<?> saveGift(
            @RequestBody GiftMasterDto giftDto,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }
            boolean success = giftMasterService.saveGift(giftDto);
            return success ? ResponseEntity.status(HttpStatus.CREATED).body("Gift saved successfully!")
                           : ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Failed to save gift.");
        }

        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                "giftmaster/save",
                HttpMethod.POST,
                giftDto,
                username,
                password);
    }

    // ============================================================
    // ✏️ UPDATE GIFT
    // ============================================================
    @PutMapping("/update")
    public ResponseEntity<?> updateGift(
            @RequestBody GiftMasterDto giftDto,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }
            boolean success = giftMasterService.updateGift(giftDto);
            return success ? ResponseEntity.ok("Gift updated successfully!")
                           : ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Failed to update gift.");
        }

        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                "giftmaster/update",
                HttpMethod.PUT,
                giftDto,
                username,
                password);
    }

    // ============================================================
    // 🗑️ DELETE GIFT
    // ============================================================
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteGift(
            @RequestParam("giftId") Long giftId,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }
            boolean success = giftMasterService.deleteGift(giftId);
            return success ? ResponseEntity.ok("Gift deleted successfully!")
                           : ResponseEntity.status(HttpStatus.NOT_FOUND).body("Gift not found with ID: " + giftId);
        }

        String path = "giftmaster/delete?giftId=" + giftId;
        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                path,
                HttpMethod.DELETE,
                null,
                username,
                password);
    }

    // ============================================================
    // 🔍 GET ALL GIFTS
    // ============================================================
    @GetMapping("/all")
    public ResponseEntity<?> getAllGifts(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }
            return ResponseEntity.ok(giftMasterService.getAllGifts());
        }

        return remoteDataFetcher.fetchRemoteList(
                shopcode,
                "giftmaster/all",
                username,
                password,
                new ParameterizedTypeReference<List<GiftMasterDto>>() {});
    }

    // ============================================================
    // 🔍 GET BY ID
    // ============================================================
    @GetMapping("/getById")
    public ResponseEntity<?> getGiftById(
            @RequestParam("giftId") Long giftId,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }
            Optional<GiftMasterDto> gift = giftMasterService.getGiftById(giftId);
            return gift.<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Gift not found with ID: " + giftId));
        }

        String path = "giftmaster/getById?giftId=" + giftId;
        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                path,
                HttpMethod.GET,
                null,
                username,
                password);
    }

    // ============================================================
    // 🔍 GET BY CODE
    // ============================================================
    @GetMapping("/getByCode")
    public ResponseEntity<?> getGiftByCode(
            @RequestParam("giftCode") String giftCode,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }
            Optional<GiftMasterDto> gift = giftMasterService.getGiftByCode(giftCode);
            return gift.<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Gift not found with code: " + giftCode));
        }

        String path = "giftmaster/getByCode?giftCode=" + URLEncoder.encode(giftCode, StandardCharsets.UTF_8);
        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                path,
                HttpMethod.GET,
                null,
                username,
                password);
    }

    // ============================================================
    // ✅ EXISTS BY CODE CHECK
    // ============================================================
    @GetMapping("/existsByCode")
    public ResponseEntity<?> existsByCode(
            @RequestParam("giftCode") String giftCode,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }
            return ResponseEntity.ok(giftMasterService.existsByGiftCode(giftCode));
        }

        String path = "giftmaster/existsByCode?giftCode=" + URLEncoder.encode(giftCode, StandardCharsets.UTF_8);
        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                path,
                HttpMethod.GET,
                null,
                username,
                password);
    }

    // ============================================================
    // ⚡ FAST TABLE / LOOKUP API (Fast fetching for UI tables)
    // ============================================================
    @GetMapping("/lookup")
    public ResponseEntity<?> getGiftLookup(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }
            return ResponseEntity.ok(giftMasterService.getGiftLookup());
        }

        return remoteDataFetcher.fetchRemoteList(
                shopcode,
                "giftmaster/lookup",
                username,
                password,
                new ParameterizedTypeReference<List<GiftLookupDto>>() {});
    }
}
