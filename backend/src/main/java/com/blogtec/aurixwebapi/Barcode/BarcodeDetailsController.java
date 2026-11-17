package com.blogtec.aurixwebapi.Barcode;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;
import com.blogtec.aurixwebapi.imagesstorage.image.ImageService;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/barcodeapi")
public class BarcodeDetailsController 
{

    private final UserService userService;
    private final BarcodeDetailsService barcodeDetailsService;
    private final ApiUserService apiUserService;
    private final RemoteDataFetcher remoteFetcher;
    private final ImageService imageService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public BarcodeDetailsController(UserService userService,
            BarcodeDetailsService barcodeDetailsService,
            ApiUserService apiUserService,
            RemoteDataFetcher remoteFetcher,
            ImageService imageService) {
        this.userService = userService;
        this.barcodeDetailsService = barcodeDetailsService;
        this.apiUserService = apiUserService;
        this.remoteFetcher = remoteFetcher;
        this.imageService = imageService;
    }

    // ============================================================
    // 🛡️ AUTH & LOCAL CHECK
    // ============================================================
    private boolean isAuthInvalid(String username, String password, String shopcode) {
        return AspCommonFunctions.authUser(username, password, shopcode, apiUserService);
    }

    private boolean isLocalShop(String shopcode) {
        return shopcode != null &&
                shopcode.equalsIgnoreCase(userService.getdefaultshopcode());
    }

    // ============================================================
    // 🔹 BARCODE DETAILS
    // ============================================================
    @SuppressWarnings("unchecked")
	@GetMapping("/data/{barcode}")
    public ResponseEntity<?> getAllBarcodeDetails(
            @PathVariable String barcode,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        try {

            // 🔀 ROUTE FIRST
            if (!isLocalShop(shopcode)) {
                // 🚀 FORWARD REMOTE (Skip local auth)
                String path = "barcodeapi/data/" + barcode;

                ResponseEntity<?> response = remoteFetcher.fetchRemoteObject(
                        shopcode, path, HttpMethod.GET, null, username, password);

                Object body = response.getBody();

                if (body == null) {
                    return ResponseEntity.status(HttpStatus.NO_CONTENT)
                            .body(Map.of("message", "No data received"));
                }

                if (body instanceof Map<?, ?> mapBody) {
                    return ResponseEntity.status(response.getStatusCode()).body(mapBody);
                }

                if (body instanceof String jsonStr && jsonStr.trim().startsWith("{")) {
                    Map<String, Object> parsed = objectMapper.readValue(jsonStr, Map.class);

                    return ResponseEntity.status(response.getStatusCode()).body(parsed);
                }

                return ResponseEntity.status(response.getStatusCode())
                        .body(Map.of("rawResponse", body));
            }

            // 🔐 AUTH SECOND (Local)
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            // ✅ LOCAL EXECUTION
            Map<String, List<?>> data = barcodeDetailsService.getAllBarcodeDetails(barcode);

            return ResponseEntity.ok(data != null ? data : Map.of());

        } catch (Exception e) {

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Failed to fetch barcode details",
                            "details", e.getMessage()));
        }
    }

    // ============================================================
    // 🖼 BARCODE IMAGE
    // ============================================================
   
	@GetMapping("/getImagebyBarcode/{barcode}")
    public ResponseEntity<?> getImageByBarcode(
            @PathVariable String barcode,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader(value = "username", required = false) String username,
            @RequestHeader(value = "password", required = false) String password) {

        if (isLocalShop(shopcode)) {
            return imageService.viewImageByBarcode(barcode);
        }

        String path = "barcodeapi/getImagebyBarcode/" + barcode;
        return remoteFetcher.fetchRemoteFile(shopcode, path, username, password);
    }
}