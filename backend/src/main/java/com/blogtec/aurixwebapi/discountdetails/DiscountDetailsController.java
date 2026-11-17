package com.blogtec.aurixwebapi.discountdetails;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;

@RestController
@RequestMapping("/discountdetails")
@SuppressWarnings({ "rawtypes", "unchecked" })
public class DiscountDetailsController {

    private final DiscountDetailsService discountDetailsService;
    private final ApiUserService apiUserService;
    private final UserService userService;
    private final RemoteDataFetcher remoteDataFetcher;
    private final DiscountDetailsJasperReportService reportService;

    @Autowired
    public DiscountDetailsController(
            DiscountDetailsService discountDetailsService,
            ApiUserService apiUserService,
            UserService userService,
            RemoteDataFetcher remoteDataFetcher,
            DiscountDetailsJasperReportService reportService) {

        this.discountDetailsService = discountDetailsService;
        this.apiUserService = apiUserService;
        this.userService = userService;
        this.remoteDataFetcher = remoteDataFetcher;
        this.reportService = reportService;
    }

    // ============================================================
    // 🛡️ HELPERS
    // ============================================================
    private boolean isAuthInvalid(String username, String password, String shopcode) {
        return AspCommonFunctions.authUser(username, password, shopcode, apiUserService);
    }

    private boolean isLocalShop(String shopcode) {
        return shopcode != null &&
                shopcode.equalsIgnoreCase(userService.getdefaultshopcode());
    }

    private ResponseEntity<?> validateLocal(String username, String password, String shopcode) {
        if (isAuthInvalid(username, password, shopcode)) {
            return AspCommonFunctions.Invalid();
        }
        return null;
    }

    // ============================================================
    // CREATE
    // ============================================================
    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody DiscountDetails discountDetails,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        discountDetails.setEstno(AspCommonFunctions.checkNull(discountDetails.getEstno()));
        discountDetails.setUsername(AspCommonFunctions.checkNull(discountDetails.getUsername()));
        discountDetails.setDiscountamt(AspCommonFunctions.checkNull(discountDetails.getDiscountamt()));
        discountDetails.setRoundoffamt(AspCommonFunctions.checkNull(discountDetails.getRoundoffamt()));
        discountDetails.setSalesamt(AspCommonFunctions.checkNull(discountDetails.getSalesamt()));
        discountDetails.setPuramt(AspCommonFunctions.checkNull(discountDetails.getPuramt()));
        discountDetails.setCrnamt(AspCommonFunctions.checkNull(discountDetails.getCrnamt()));
        discountDetails.setSaleswt(AspCommonFunctions.checkNull(discountDetails.getSaleswt()));
        discountDetails.setPurwt(AspCommonFunctions.checkNull(discountDetails.getPurwt()));
        discountDetails.setCrnwt(AspCommonFunctions.checkNull(discountDetails.getCrnwt()));
        discountDetails.setShopCode(shopcode);

        // 🔸 LOCAL
        if (isLocalShop(shopcode)) {
            ResponseEntity<?> error = validateLocal(username, password, shopcode);
            if (error != null)
                return error;

            return ResponseEntity.ok(discountDetailsService.create(discountDetails));
        }

        // 🔸 REMOTE
        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                "discountdetails/create",
                HttpMethod.POST,
                discountDetails,
                username,
                password);
    }


    // ============================================================
    // DELETE
    // ============================================================
    @DeleteMapping("/deleteByReset")
    public ResponseEntity<?> deleteByReset(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            ResponseEntity<?> error = validateLocal(username, password, shopcode);
            if (error != null)
                return error;

            return discountDetailsService.DeleteByReSet();
        }

        return remoteDataFetcher.deleteRemoteObject(
                shopcode,
                "discountdetails/deleteByReset",
                username,
                password);
    }

    // ============================================================
    // FIND ALL
    // ============================================================
    @GetMapping("/findByAll")
    public ResponseEntity<?> findByAll(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            ResponseEntity<?> error = validateLocal(username, password, shopcode);
            if (error != null)
                return error;

            return ResponseEntity.ok(discountDetailsService.findByAll(shopcode));
        }

        return remoteDataFetcher.fetchRemoteList(
                shopcode,
                "discountdetails/findByAll",
                username,
                password,
                new ParameterizedTypeReference<List<DiscountDetails>>() {
                });
    }

    // ============================================================
    // FIND BY ESTNO
    // ============================================================
    @GetMapping("/findByEstNo")
    public ResponseEntity<?> findByEstNo(
            @RequestParam("estno") String estno,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            ResponseEntity<?> error = validateLocal(username, password, shopcode);
            if (error != null)
                return error;

            return ResponseEntity.ok(
                    discountDetailsService.findByestno(estno, shopcode));
        }

        return remoteDataFetcher.fetchRemoteList(
                shopcode,
                "discountdetails/findByEstNo?estno=" + estno,
                username,
                password,
                new ParameterizedTypeReference<List<DiscountDetails>>() {
                });
    }

    // ============================================================
    // REPORT JSON
    // ============================================================

    @GetMapping("/report/discountdetails")
    public ResponseEntity<Map<String, Object>> report(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        List<DiscountDetails> list;

        if (isLocalShop(shopcode)) {
            ResponseEntity<?> error = validateLocal(username, password, shopcode);
            if (error != null)
                return (ResponseEntity) error;

            list = discountDetailsService.findByAll(shopcode);

        } else {
            list = remoteDataFetcher.fetchRemoteList(
                    shopcode,
                    "discountdetails/findByAll",
                    username,
                    password,
                    new ParameterizedTypeReference<List<DiscountDetails>>() {
                    })
                    .getBody();
        }

        return ResponseEntity.ok(Map.of(
                "DiscountDetails",
                list != null ? list : new ArrayList<>()));
    }

    // ============================================================
    // REPORT PDF
    // ============================================================
    @GetMapping("/report/discountdetails/pdf")
    public ResponseEntity<?> reportPdf(
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        try {
            byte[] pdfBytes;

            if (isLocalShop(shopcode)) {

                ResponseEntity<?> error = validateLocal(username, password, shopcode);
                if (error != null)
                    return error;

                List<DiscountDetails> list = discountDetailsService.findByAll(shopcode);

                if (list == null || list.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NO_CONTENT)
                            .body(Map.of("message", "No records found"));
                }

                pdfBytes = reportService.generatePdfReport(list);

            } else {

                ResponseEntity<byte[]> response = remoteDataFetcher.fetchRemoteFile(
                        shopcode,
                        "discountdetails/report/discountdetails/pdf/file",
                        username,
                        password);

                if (response == null || response.getBody() == null) {
                    return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                            .body(Map.of("message", "Failed to fetch PDF"));
                }

                pdfBytes = response.getBody();
            }

            return ResponseEntity.ok(Map.of(
                    "filename", "DiscountReport.pdf",
                    "contentType", "application/pdf",
                    "pdfBase64", Base64.getEncoder().encodeToString(pdfBytes)));

        } catch (Exception e) {

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Failed to generate report",
                            "details", e.getMessage()));
        }
    }

    // ============================================================
    // FIND BY ESTNO → MAX SLNO (latest entry for that estimate)
    // ============================================================
    @GetMapping("/findByEstNoMaxSlno")
    public ResponseEntity<?> findByEstNoMaxSlno(
            @RequestParam("estno") int estno,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            ResponseEntity<?> error = validateLocal(username, password, shopcode);
            if (error != null)
                return error;

            DiscountDetails result = discountDetailsService.findByEstnoMaxSlno(estno);
            if (result == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "No record found for estno: " + estno));
            return ResponseEntity.ok(result);
        }

        return remoteDataFetcher.fetchRemoteGeneric(
                shopcode,
                "discountdetails/findByEstNoMaxSlno?estno=" + estno,
                HttpMethod.GET, null, username, password,
                new ParameterizedTypeReference<DiscountDetails>() {
                });
    }

    // ============================================================
    // FIND BY ESTNO AND USERNAME
    // ============================================================
    @GetMapping("/findByEstNoAndUser")
    public ResponseEntity<?> findByEstNoAndUser(
            @RequestParam("estno") int estno,
            @RequestParam("username") String user,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            ResponseEntity<?> error = validateLocal(username, password, shopcode);
            if (error != null)
                return error;

            return ResponseEntity.ok(discountDetailsService.findByEstnoAndUsername(estno, user));
        }

        return remoteDataFetcher.fetchRemoteList(
                shopcode,
                "discountdetails/findByEstNoAndUser?estno=" + estno + "&username=" + user,
                username, password,
                new ParameterizedTypeReference<List<DiscountDetails>>() {
                });
    }
}
