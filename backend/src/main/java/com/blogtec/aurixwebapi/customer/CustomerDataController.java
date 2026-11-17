package com.blogtec.aurixwebapi.customer;

import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.config.IpConfig;
import com.blogtec.aurixwebapi.dto.CrmCreateDTO;
import com.blogtec.aurixwebapi.dto.CrmDTO;
import com.blogtec.aurixwebapi.dto.CrmPageResponseDTO;
import com.blogtec.aurixwebapi.dto.GetCustDataDto;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;
import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;
import org.springframework.http.HttpMethod;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/customer")
@Tag(name = "Customer Data Controller API", description = "Customer Data, Scheme Info, and High-Speed CRM Management APIs")
public class CustomerDataController {

    private static final Logger logger = LoggerFactory.getLogger(CustomerDataController.class);

    private final CustomerDataService crmService;
    private final UserService userService;
    private final GetCustDataDto getCustDataDto;
    private final ApiUserService apiUserService;
    private final RemoteDataFetcher remoteDataFetcher;

    public CustomerDataController(CustomerDataService crmService,
            UserService userService,
            GetCustDataDto getCustDataDto,
            ApiUserService apiUserService,
            RemoteDataFetcher remoteDataFetcher) {
        this.crmService = crmService;
        this.userService = userService;
        this.getCustDataDto = getCustDataDto;
        this.apiUserService = apiUserService;
        this.remoteDataFetcher = remoteDataFetcher;
    }

    // ============================================================
    // 🛡️ AUTH HELPERS
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

    private ResponseEntity<?> parseAndReturnJson(String response, String fallbackMessage) {
        if (response != null && !response.trim().isEmpty()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(response);

                if (root.isArray()) {
                    if (root.size() > 0) {
                        return ResponseEntity.ok(root.get(0));
                    }
                } else if (root.isObject()) {
                    return ResponseEntity.ok(root);
                } else {
                    return ResponseEntity.ok(root);
                }
            } catch (Exception e) {
                logger.error("JSON Parsing Error for response: {}", response, e);
                return ResponseEntity.ok(response);
            }
        }

        return ResponseEntity.ok(Map.of("message", fallbackMessage));
    }

    // ============================================================
    // GET CUSTOMER DATA (SCHEME)
    // ============================================================
    @GetMapping("/getCustData/{custid}")
    @Operation(summary = "Get Customer Data from Scheme", description = "Fetches customer master details from the connected Scheme server by customer ID.")
    public ResponseEntity<?> getCustData(
            @Parameter(description = "Customer ID", example = "P041813", required = true)
            @PathVariable String custid) {

        String apiUrl = IpConfig.projectSchemeUrl + "custdata/find-by-custid/" + custid;
        String response = getCustDataDto.apiResponseGet(apiUrl);

        return parseAndReturnJson(response, "No customer data found for custid: " + custid);
    }

    // ============================================================
    // GET CRM BY PHONE
    // ============================================================
    @GetMapping("/crmphoneno/{phoneno}")
    @Operation(summary = "Find CRM Customer by Phone Number", description = "Searches CRM customer details by mobile/phone number.")
    public ResponseEntity<?> getCrmPhone(
            @Parameter(description = "Customer Phone/Mobile Number", example = "9895946945", required = true)
            @PathVariable String phoneno) {

        String response = crmService.findByMobile(phoneno);
        return parseAndReturnJson(response, "No CRM customer found for mobile: " + phoneno);
    }

    // ============================================================
    // CREATE CRM
    // ============================================================
    @PostMapping("/create")
    @Operation(summary = "Create CRM Customer", description = "Registers a new CRM customer with branch routing and authentication.")
    public ResponseEntity<?> createCrmCustomer(
            @RequestBody CrmCreateDTO crmdata,
            @Parameter(description = "Shop Code", example = "HO", required = true)
            @RequestParam("shopcode") String shopcode,
            @Parameter(description = "API Username", required = true)
            @RequestHeader("username") String username,
            @Parameter(description = "API Password", required = true)
            @RequestHeader("password") String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, "/customer/create", HttpMethod.POST, crmdata, username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        try {
            String response = crmService.createCrmCustomer(crmdata);
            return parseAndReturnJson(response, "Failed to create CRM customer");
        } catch (Exception e) {
            logger.error("CRM creation failed for data: {}", crmdata, e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "CRM creation failed: " + e.getMessage()));
        }

    }

    // ============================================================
    // UPDATE CRM
    // ============================================================
    @PutMapping("/update/{crmid}")
    @Operation(summary = "Update CRM Customer", description = "Updates existing CRM customer information by CRM ID.")
    public ResponseEntity<?> updateCrmCustomer(
            @Parameter(description = "CRM ID", example = "168291", required = true)
            @PathVariable String crmid,
            @RequestBody Map<String, Object> crmdata,
            @Parameter(description = "Shop Code", example = "HO", required = true)
            @RequestParam("shopcode") String shopcode,
            @Parameter(description = "API Username", required = true)
            @RequestHeader("username") String username,
            @Parameter(description = "API Password", required = true)
            @RequestHeader("password") String password) {

        // 🔀 ROUTE FIRST
        if (!isLocalShop(shopcode)) {
            return remoteDataFetcher.fetchRemoteObject(
                    shopcode, "/customer/update/" + crmid, HttpMethod.PUT, crmdata, username, password);
        }

        // 🔐 AUTH SECOND (Local)
        if (isAuthInvalid(username, password, shopcode)) {
            return invalidAuth();
        }

        String response = crmService.updateCrmCustomer(crmid, crmdata);
        return parseAndReturnJson(response, "Failed to update CRM customer");
    }

    // ============================================================
    // FIND CRM BY CUSTID
    // ============================================================
    @GetMapping("/find-by-custid")
    @Operation(summary = "Find CRM Customer by CustID", description = "Searches CRM customer details by their customer identifier.")
    public ResponseEntity<?> findCrmByCustId(
            @Parameter(description = "Customer ID", example = "P041813", required = true)
            @RequestParam String custid) {

        String response = crmService.findByCustId(custid);
        return parseAndReturnJson(response, "No CRM customer found for custid: " + custid);
    }

    // ============================================================
    // CRM CUSTOMERS (Supports both Paged Table & Direct Array)
    // - If page is provided: Returns CrmPageResponseDTO { content, page, size, totalElements, totalPages }
    // - If page is NOT provided: Returns direct JSON Array of newest records (prevents browser freeze)
    // - If all=true: Returns full unpaged list
    // ============================================================
    @GetMapping("/all-customers")
    @Operation(
        summary = "Get All CRM Customers",
        description = "Fetches CRM customers. If page is passed, returns paginated CrmPageResponseDTO. If called without page, returns a direct JSON Array of newest customers (safe limit 100) to prevent frontend hang."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Successful response", 
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = CrmPageResponseDTO.class)
            )
        )
    })
    public ResponseEntity<?> getAllCrmCustomers(
            @Parameter(description = "Page number (1-based index). If provided, returns paged object.", example = "1")
            @RequestParam(required = false) Integer page,
            @Parameter(description = "Page size or array limit (default 20 for paged, 100 for array, max 100)", example = "20")
            @RequestParam(required = false) Integer size,
            @Parameter(description = "Search keyword (matches name, customer ID, or mobile)", example = "siva")
            @RequestParam(required = false) String search,
            @Parameter(description = "Retrieve full unpaged list (boolean flag)", example = "false")
            @RequestParam(defaultValue = "false") boolean all) {

        if (all) {
            List<CrmDTO> customers = crmService.findCrmByAll();
            if (customers == null || customers.isEmpty()) {
                return ResponseEntity.ok(Map.of("message", "No CRM customer found"));
            }
            return ResponseEntity.ok(customers);
        }

        // If client explicitly requests pagination with page parameter
        if (page != null) {
            int p = Math.max(page, 1);
            int s = (size != null && size > 0) ? Math.min(size, 100) : 20;
            return ResponseEntity.ok(crmService.findCrmPaged(p, s, search));
        }

        // Default for frontend callers (like ShopAPI.js expecting a direct Array):
        // Return direct JSON Array of newest customers (safe limit 100) so site never hangs
        int safeLimit = (size != null && size > 0) ? Math.min(size, 100) : 100;
        Map<String, Object> paged = crmService.findCrmPaged(1, safeLimit, search);
        Object content = paged.get("content");
        return ResponseEntity.ok(content != null ? content : List.of());
    }

    // ============================================================
    // CRM CUSTOMERS - PAGED ALIAS
    // ============================================================
    @GetMapping("/crm-page")
    @Operation(summary = "Get Paged CRM Customers", description = "Direct pagination endpoint for front-end data tables.")
    public ResponseEntity<?> getCrmPaged(
            @Parameter(description = "Page number (1-based)", example = "1")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Search keyword", example = "siva")
            @RequestParam(required = false) String search) {

        return ResponseEntity.ok(crmService.findCrmPaged(page, size, search));
    }

    // ============================================================
    // CRM CUSTOMERS - 0-BASED PAGE ALIAS
    // ============================================================
    @GetMapping("/all-customers/page")
    @Operation(summary = "Get Paged CRM Customers (0-based Index)", description = "Pagination endpoint using 0-based page index for frameworks like Spring Data Pageable.")
    public ResponseEntity<?> getCrmCustomersPaged(
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Search keyword", example = "siva")
            @RequestParam(required = false) String search) {

        return ResponseEntity.ok(crmService.findCrmPaged(Math.max(page, 0) + 1, size, search));
    }

    // ============================================================
    // UTILITY APIs (NO AUTH REQUIRED)
    // ============================================================
    @GetMapping("/getipadrress")
    @Operation(summary = "Get Base WebApp URL", description = "Returns the base URL configured for the web application.")
    public ResponseEntity<?> getipadrress() {
        return ResponseEntity.ok(Map.of("Baseurl", IpConfig.webAppUrl));
    }

    @GetMapping("/getshopcode")
    @Operation(summary = "Get Current Shop Code", description = "Returns the active shop code.")
    public ResponseEntity<?> getshopcode() {
        return ResponseEntity.ok(userService.getShopcode());
    }

    @GetMapping("/getdefaultshopcode")
    @Operation(summary = "Get Default Shop Code", description = "Returns the system default shop code.")
    public ResponseEntity<?> getdefaultshopcode() {
        return ResponseEntity.ok(userService.getdefaultshopcode());
    }

    @GetMapping("/getipbyShopcode")
    @Operation(summary = "Get IP Address by Shop Code", description = "Returns the IP configuration corresponding to a specific shop code.")
    public ResponseEntity<?> getipbyShopcode(
            @Parameter(description = "Shop Code", example = "HO", required = true)
            @RequestParam String shopcode) {
        return ResponseEntity.ok(userService.getipbyShopcode(shopcode));
    }
}
