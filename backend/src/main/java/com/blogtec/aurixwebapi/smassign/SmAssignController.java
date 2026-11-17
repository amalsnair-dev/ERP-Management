package com.blogtec.aurixwebapi.smassign;

import java.time.LocalDate;
import java.util.*;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;
import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;

@RestController
@RequestMapping("/dailycustomer")
public class SmAssignController {

    private final SmAssignService assignService;
    private final ApiUserService apiUserService;
    private final SmAssignJasperReportService reportService;
    private final UserService userService;
    private final RemoteDataFetcher remoteDataFetcher;

    @Autowired
    public SmAssignController(
            SmAssignService assignService,
            ApiUserService apiUserService,
            SmAssignJasperReportService reportService,
            UserService userService,
            RemoteDataFetcher remoteDataFetcher) {

        this.assignService = assignService;
        this.apiUserService = apiUserService;
        this.reportService = reportService;
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
    // CREATE
    // ============================================================
    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody SmAssign smassign,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {

            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            // Null-safe
            smassign.setName(AspCommonFunctions.checkNull(smassign.getName()));
            smassign.setPhoneNo(AspCommonFunctions.checkNull(smassign.getPhoneNo()));
            smassign.setPlace(AspCommonFunctions.checkNull(smassign.getPlace()));
            smassign.setSmCode(AspCommonFunctions.checkNull(smassign.getSmCode()));
            smassign.setDate(AspCommonFunctions.checkNull(smassign.getDate()));
            smassign.setTime(AspCommonFunctions.checkNull(smassign.getTime()));
            smassign.setShopcode(shopcode);

            return ResponseEntity.ok(assignService.create(smassign));
        }

        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                "dailycustomer/create",
                HttpMethod.POST,
                smassign,
                username,
                password);
    }

    // ============================================================
    // UPDATE
    // ============================================================
    @PutMapping("/update")
    public ResponseEntity<?> update(@RequestParam("slno") int slno,
            @RequestBody SmAssign updatedSmAssign,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {

            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            return ResponseEntity.ok(assignService.updateSmAssign(slno, updatedSmAssign));
        }

        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                "dailycustomer/update?slno=" + slno,
                HttpMethod.PUT,
                updatedSmAssign,
                username,
                password);
    }

    @PutMapping("/updateByDateEntry")
    public ResponseEntity<?> updateByDateEntry(
            @RequestParam("entryno") int entryno,
            @RequestParam("date") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date,
            @RequestParam("shopcode") String shopcode,
            @RequestBody SmAssign updatedSmAssign,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {

            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            return ResponseEntity.ok(assignService.updateByDateEntry(entryno, date, updatedSmAssign));
        }

        String path = "dailycustomer/updateByDateEntry?entryno=" + entryno + "&date=" + date;

        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                path,
                HttpMethod.PUT,
                updatedSmAssign,
                username,
                password);
    }

    // ============================================================
    // GET
    // ============================================================
    @GetMapping("/findBySmcode")
    public ResponseEntity<?> findBySmcode(
            @RequestParam("smcode") String smcode,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {

            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            return ResponseEntity.ok(assignService.findBySmcode(smcode));
        }

        return remoteDataFetcher.fetchRemoteList(
                shopcode,
                "dailycustomer/findBySmcode?smcode=" + smcode,
                username,
                password,
                new ParameterizedTypeReference<List<SmAssign>>() {});
    }

    @GetMapping("/findByPhoneNo")
    public ResponseEntity<?> findByPhoneNo(
            @RequestParam("phoneno") String phoneno,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }
            return ResponseEntity.ok(assignService.findByPhoneNo(phoneno));
        }

        return remoteDataFetcher.fetchRemoteList(
                shopcode,
                "dailycustomer/findByPhoneNo?phoneno=" + phoneno,
                username,
                password,
                new ParameterizedTypeReference<List<SmAssign>>() {});
    }

    @GetMapping("/findByDate")
    public ResponseEntity<?> findByDate(
            @RequestParam("date") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }
            return ResponseEntity.ok(assignService.findByDate(date));
        }

        return remoteDataFetcher.fetchRemoteList(
                shopcode,
                "dailycustomer/findByDate?date=" + date,
                username,
                password,
                new ParameterizedTypeReference<List<SmAssign>>() {});
    }

    // ============================================================
    // DELETE
    // ============================================================
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteById(
            @RequestParam("slno") int slno,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {

            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            return assignService.DeleteById(slno);
        }

        return remoteDataFetcher.fetchRemoteObject(
                shopcode,
                "dailycustomer/delete?slno=" + slno,
                HttpMethod.DELETE,
                null,
                username,
                password);
    }

    @DeleteMapping("/deleteByDateAndEntryNo")
    public ResponseEntity<?> deleteByDateEntry(
            @RequestParam("entryno") int entryno,
            @RequestParam("date") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }
            return assignService.DeleteByDateEntry(entryno, date);
        }

        String path = "dailycustomer/deleteByDateAndEntryNo?entryno=" + entryno + "&date=" + date;
        return remoteDataFetcher.deleteRemoteObject(shopcode, path, username, password);
    }

    // ============================================================
    // REPORT PDF
    // ============================================================
    @GetMapping("/report/fromtodatewise/pdf")
    public ResponseEntity<?> reportPdf(
            @RequestParam("fromdate") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate fromdate,
            @RequestParam("todate") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate todate,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        if (isLocalShop(shopcode)) {

            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }

            try {
                List<SmAssign> list = assignService.reportFormToDate(fromdate, todate);

                if (list == null || list.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NO_CONTENT)
                            .body(Map.of("message", "No records found"));
                }

                byte[] pdfBytes = reportService.generateSmAssignReport(list);

                return ResponseEntity.ok(Map.of(
                        "filename", "DailyCustomerReport.pdf",
                        "contentType", "application/pdf",
                        "pdfBase64", Base64.getEncoder().encodeToString(pdfBytes)));

            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", e.getMessage()));
            }
        }

        String path = "dailycustomer/report/fromtodatewise/pdf/file?fromdate=" + fromdate + "&todate=" + todate;

        ResponseEntity<byte[]> response = remoteDataFetcher.fetchRemoteFile(
                shopcode, path, username, password);

        if (response == null || response.getBody() == null) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Failed to fetch PDF"));
        }

        return ResponseEntity.ok(Map.of(
                "filename", "DailyCustomerReport.pdf",
                "contentType", "application/pdf",
                "pdfBase64", Base64.getEncoder().encodeToString(response.getBody())));
    }

    @GetMapping("/report/smcodewise")
    public ResponseEntity<Map<String, Object>> reportSmcodeWise(
            @RequestParam("smcode") String smcode,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        List<SmAssign> smAssignList;

        if (isLocalShop(shopcode)) {
            if (isAuthInvalid(username, password, shopcode)) {
                return AspCommonFunctions.Invalid();
            }
            smAssignList = assignService.findBySmcode(smcode);
        } else {
            smAssignList = remoteDataFetcher.fetchRemoteList(
                    shopcode,
                    "dailycustomer/findBySmcode?smcode=" + smcode,
                    username,
                    password,
                    new ParameterizedTypeReference<List<SmAssign>>() {}).getBody();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("SmAssign", smAssignList != null ? smAssignList : new ArrayList<>());
        return ResponseEntity.ok(response);
    }

    @SuppressWarnings("null")
	@GetMapping("/report/fromtodatewise/pdf/file")
    public ResponseEntity<byte[]> exportPdfFile(
            @RequestParam("fromdate") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate fromdate,
            @RequestParam("todate") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate todate,
            @RequestParam("shopcode") String shopcode,
            @RequestHeader("username") String username,
            @RequestHeader("password") String password) {

        try {
            if (isAuthInvalid(username, password, shopcode)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<SmAssign> smAssignList = assignService.reportFormToDate(fromdate, todate);
            if (smAssignList == null || smAssignList.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
            }

            byte[] pdfBytes = reportService.generateSmAssignReport(smAssignList);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=DailyCustomerReport.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}