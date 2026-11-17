package com.blogtec.aurixwebapi.sales;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.dto.*;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * ✅ CashMarkingController
 * Handles Cash Marking operations including estimation checks, VA updates, and
 * discounts.
 * Implements "Route first, Auth second" architecture for remote branch
 * communication.
 */
@RestController
@RequestMapping("/cashmark")
@Tag(name = "Cashmark Controller API", description = "Handles Cash Marking operations including estimation checks, VA updates, and discounts.")
public class CashMarkingController {

    private final CashmarkingService service;
    private final UserService userService;
    private final ApiUserService apiUserService;
    private final RemoteDataFetcher remoteDataFetcher;

    public CashMarkingController(CashmarkingService service,
            UserService userService,
            ApiUserService apiUserService,
            RemoteDataFetcher remoteDataFetcher) {
        this.service = service;
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
        String defaultShop = userService.getdefaultshopcode();
        if (shopcode == null || defaultShop == null)
            return false;

        // Exact match
        if (shopcode.equalsIgnoreCase(defaultShop))
            return true;

        // Handle CODE:N variants (e.g. TCR vs TCR:1)
        if (defaultShop.toUpperCase().startsWith(shopcode.toUpperCase() + ":"))
            return true;
        if (shopcode.toUpperCase().startsWith(defaultShop.toUpperCase() + ":"))
            return true;

        return false;
    }

    private ResponseEntity<?> invalidAuth() {
        return AspCommonFunctions.Invalid();
    }

    // ============================================================
    // 📊 GET ENDPOINTS
    // ============================================================

    @GetMapping("/findall")
    @Operation(summary = "Get All Data", description = "Fetch all estimation data from local shop.")
    public ResponseEntity<List<estmstrDto>> getAllData() {
        return ResponseEntity.ok(service.getAlldata());
    }

    @GetMapping("/get/{id}")
    @Operation(summary = "Get Estimation by ID")
    public ResponseEntity<?> findByEstno(
            @PathVariable int id,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/get/" + id, HttpMethod.GET, null, username,
                    password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        return ResponseEntity.ok(service.findbyId(id));
    }

    @GetMapping("/getcheckestno/{id}")
    @Operation(summary = "Check Estimation No", description = "Checks if an estimation number is already billed in cashmarking.")
    public ResponseEntity<?> checkEstno(
            @PathVariable int id,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/getcheckestno/" + id, HttpMethod.GET, null,
                    username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        return ResponseEntity.ok(service.checkestnobilledornotincashmarking(id));
    }

    @GetMapping("/checkdiamond")
    @Operation(summary = "Check Diamond Estimation", description = "Checks whether the estimation contains diamond items.")
    public ResponseEntity<?> checkDiamond(
            @RequestParam int estno,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/checkdiamond?estno=" + estno, HttpMethod.GET,
                    null, username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        return ResponseEntity.ok(service.checkisitdiamond(estno));
    }

    @GetMapping("/getmaximumdmdamountfromsetdiscount")
    @Operation(summary = "Get Maximum DMD Amount", description = "Fetch maximum diamond rate amount from discount settings.")
    public ResponseEntity<?> getMaximumDmdAmount(
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/getmaximumdmdamountfromsetdiscount",
                    HttpMethod.GET, null, username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        return ResponseEntity.ok(service.maximumamountindmdrate());
    }

    @GetMapping("/getsum/{id}")
    @Operation(summary = "Get Transaction Summary")
    public ResponseEntity<?> getTransactionSummary(
            @PathVariable int id,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteList(shopcode, "cashmark/getsum/" + id, username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        return ResponseEntity.ok(service.getTransactionSummary(id));
    }

    @GetMapping("/getvadata/{id}")
    @Operation(summary = "Get VA Data")
    public ResponseEntity<?> getTransactionUpdateVaamt(
            @PathVariable long id,
            @RequestParam(defaultValue = "false") boolean vastatus,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteList(shopcode, "cashmark/getvadata/" + id + "?vastatus=" + vastatus,
                    username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        return ResponseEntity.ok(service.getTransactionUpdateVaamt(id, vastatus));
    }

    @GetMapping("/getafteramt/{id}")
    @Operation(summary = "Get After Amount", description = "Fetch after-amount details by estimation ID.")
    public ResponseEntity<?> getAfterAmount(
            @PathVariable int id,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/getafteramt/" + id, HttpMethod.GET, null,
                    username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        return ResponseEntity.ok(service.amount(id));
    }

    @GetMapping("/getestno/{id}")
    @Operation(summary = "Get by Estimation No")
    public ResponseEntity<?> getByEstno(
            @PathVariable int id,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteList(shopcode, "cashmark/getestno/" + id, username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        return ResponseEntity.ok(service.findbysalesstestno(id));
    }

    @GetMapping("/getdmddiscount")
    @Operation(summary = "Get DMD Discount")
    public ResponseEntity<?> getDmdDiscount(
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/getdmddiscount", HttpMethod.GET, null,
                    username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        return ResponseEntity.ok(service.getdmddiscount());
    }

    @GetMapping("/vastatus-calculation")
    @Operation(summary = "Get VA Status Calculation Status")
    public ResponseEntity<?> getVastatusCalculation(
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/vastatus-calculation", HttpMethod.GET, null,
                    username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        return ResponseEntity.ok(service.getVastatusCalculation());
    }

    @GetMapping("/company-image")
    @Operation(summary = "Get Company Image")
    public ResponseEntity<?> getCompanyImage(
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteFile(shopcode, "/cashmark/company-image", username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        byte[] image = service.getCompanyImage();
        if (image == null)
            return ResponseEntity.notFound().build();

        return ResponseEntity.ok()
                .header("Content-Type", "image/png") // Defaulting to PNG
                .header("Cache-Control", "public, max-age=604800, must-revalidate")
                .body(image);
    }

    // ============================================================
    // ✍️ POST / PUT ENDPOINTS
    // ============================================================

    @PostMapping("/updatevadata")
    @Operation(summary = "Update VA Data")
    public ResponseEntity<?> updateVaData(
            @RequestBody List<ModifyVaAmt> modifyVa,
            @RequestParam(defaultValue = "false") boolean vastatus,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/updatevadata?vastatus=" + vastatus,
                    HttpMethod.POST, modifyVa, username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        return ResponseEntity.ok(service.modify(modifyVa, vastatus));
    }

    @PostMapping("/updateestmstrdmdrate")
    @Operation(summary = "Update Estimation Diamond Rate")
    public ResponseEntity<?> updateEstmstrDmdRate(
            @RequestBody updateestmstrdmdrateDto dto,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/updateestmstrdmdrate", HttpMethod.POST, dto,
                    username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        return ResponseEntity.ok(service.updateDmdamt(dto));
    }

    @PostMapping("/updatevavaamtanddmdratepercentage")
    @Operation(summary = "Update VA VA Amount & DMD Rate Percentage")
    public ResponseEntity<?> updateVaVaAmtAndDmdRatePercentage(
            @RequestBody updatevavaamtanddmdratepercentageDto dto,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/updatevavaamtanddmdratepercentage",
                    HttpMethod.POST, dto, username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        return ResponseEntity.ok(service.updatevavaamtanddmdratepercentage(dto));
    }

    @PostMapping("/updatesaleeststnchg")
    @Operation(summary = "Update Sale Estimation Stone Change")
    public ResponseEntity<?> updateSaleEstStnChg(
            @RequestBody updateestmstrdmdrateDtoWithFlag dto,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/updatesaleeststnchg", HttpMethod.POST, dto,
                    username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        service.updatesaleeststnchg(dto);
        return ResponseEntity.ok(Map.of("message", "Sale Estimation Stone Change Updated"));
    }

    @PutMapping("/resetestno")
    @Operation(summary = "Reset Estimation No", description = "Reset VA details for a given estimation number.")
    public ResponseEntity<?> resetEstno(
            @RequestParam String estno,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/resetestno?estno=" + estno, HttpMethod.PUT,
                    null, username, password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        service.resetVadetails(estno);
        return ResponseEntity.ok(Map.of("message", "Estimation reset successful"));
    }

    @PostMapping("/create")
    @Operation(summary = "Create New Estimate", description = "Inserts a new estimate record into estmstr table.")
    public ResponseEntity<?> createEstimate(
            @RequestBody SetEstMstrDto dto,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/create", HttpMethod.POST, dto, username,
                    password);
        }

        if (isAuthInvalid(username, password, shopcode))
            return invalidAuth();

        service.saveEstimate(dto);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Estimate inserted successfully (local shop)",
                "estNo", dto.getEstNo()));
    }

    @GetMapping("/getgiftdetails/{id}")
    @Operation(summary = "Get Gift Details", description = "Fetches gift_no, collamt, and barcode_flag from estmstr for a given estimation number.")
    public ResponseEntity<?> getGiftDetails(
            @PathVariable int id,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/getgiftdetails/" + id, HttpMethod.GET, null, username, password);
        }

        if (isAuthInvalid(username, password, shopcode)) return invalidAuth();

        return ResponseEntity.ok(service.getGiftDetails(id));
    }

    @PutMapping("/updategiftdetails")
    @Operation(summary = "Update Gift Details via DTO", description = "Updates gift_no, collamt, and barcode_flag in estmstr using request body DTO.")
    public ResponseEntity<?> updateGiftDetails(
            @RequestBody UpdateGiftDetailsDto dto,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/updategiftdetails", HttpMethod.PUT, dto, username, password);
        }

        if (isAuthInvalid(username, password, shopcode)) return invalidAuth();

        service.updateGiftDetails(dto);
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Gift details updated successfully",
            "estNo", dto.getEstNo() != null ? dto.getEstNo() : 0
        ));
    }

    @PutMapping("/resetgiftdetails/{id}")
    @Operation(summary = "Reset Gift Details", description = "Resets gift_no='0', collamt=0, and barcode_flag=false in estmstr for a given estimation number.")
    public ResponseEntity<?> resetGiftDetails(
            @PathVariable int id,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/resetgiftdetails/" + id, HttpMethod.PUT, null, username, password);
        }

        if (isAuthInvalid(username, password, shopcode)) return invalidAuth();

        service.resetGiftDetails(id);
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Gift details reset successfully",
            "estNo", id
        ));
    }

    @PutMapping("/updatebarcodeflag/{id}")
    @Operation(summary = "Update Barcode Flag", description = "Updates barcode_flag in estmstr for a given estimation number.")
    public ResponseEntity<?> updateBarcodeFlag(
            @PathVariable int id,
            @RequestParam(defaultValue = "false") boolean barcodeFlag,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/updatebarcodeflag/" + id + "?barcodeFlag=" + barcodeFlag, HttpMethod.PUT, null, username, password);
        }

        if (isAuthInvalid(username, password, shopcode)) return invalidAuth();

        service.updateBarcodeFlag(id, barcodeFlag);
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Barcode flag updated successfully",
            "estNo", id,
            "barcodeFlag", barcodeFlag
        ));
    }

    @GetMapping("/getbarcodeflag/{id}")
    @Operation(summary = "Get Barcode Flag", description = "Fetches barcode_flag from estmstr for a given estimation number.")
    public ResponseEntity<?> getBarcodeFlag(
            @PathVariable int id,
            @RequestParam String shopcode,
            @RequestHeader String username,
            @RequestHeader String password) {

        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(shopcode, "cashmark/getbarcodeflag/" + id, HttpMethod.GET, null, username, password);
        }

        if (isAuthInvalid(username, password, shopcode)) return invalidAuth();

        return ResponseEntity.ok(service.getBarcodeFlag(id));
    }
}

