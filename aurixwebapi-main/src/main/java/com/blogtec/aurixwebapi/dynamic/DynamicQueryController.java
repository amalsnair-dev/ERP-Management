package com.blogtec.aurixwebapi.dynamic;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.RequestBody;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;


import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpMethod;
import org.springframework.core.ParameterizedTypeReference;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;
import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;
import com.blogtec.aurixwebapi.dto.GetCustDataDto;
import com.blogtec.aurixwebapi.config.IpConfig;
import org.springframework.web.bind.annotation.GetMapping;
import io.swagger.v3.oas.annotations.tags.Tag;


@RestController
@RequestMapping("/api/query")
@Tag(name = "Dynamic Query Controller API", description = "Dynamic Query related APIs")
public class DynamicQueryController {

    private static final Logger logger = LoggerFactory.getLogger(DynamicQueryController.class);



    @Autowired
    private DynamicQueryService service;

    @Autowired
    private ApiUserService apiUserService;

    @Autowired
    private UserService userService;

    @Autowired
    private RemoteDataFetcher remoteFetcher;

    @Autowired
    private GetCustDataDto getCustDataDto;

    @Autowired
    private ObjectMapper mapper;



    private boolean isLocalShop(String shopcode) {
        return shopcode != null && shopcode.equalsIgnoreCase(userService.getdefaultshopcode());
    }

    private void authenticate(String username, String password, String shopcode) {
        if (AspCommonFunctions.authUser(username, password, shopcode, apiUserService)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Credentials");
        }
    }

    private ResponseEntity<?> parseAndReturnJson(String response, String fallbackMessage) {
        if (response != null && !response.trim().isEmpty()) {
            try {
                com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(response);

                
                if (root.isArray()) {
                    return ResponseEntity.ok(root.size() == 1 ? root.get(0) : root);
                }
                return ResponseEntity.ok(root);
            } catch (Exception e) {
                logger.error("JSON Parsing Error for response: {}", response, e);
                return ResponseEntity.ok(response);
            }
        }

        return ResponseEntity.ok(Map.of("message", fallbackMessage));
    }


    @GetMapping("/getdata")
    public ResponseEntity<?> getCustData(
            @RequestHeader("api") String api) {

        String apiUrl = IpConfig.projectSchemeUrl + api;
        String response = getCustDataDto.apiResponseGet(apiUrl);

        return parseAndReturnJson(response, "No data found for api: " + api);
    }


    @PostMapping(value = "/execute", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> executeQuery(
            @RequestHeader("username") String username,
            @RequestHeader("password") String password,
            @RequestParam(value = "shopcode", required = false) String shopcode,
            @RequestParam(value = "type", defaultValue = "list") String type,
            @RequestBody DynamicQueryRequest request,
            HttpServletResponse response) throws IOException {

        if (shopcode == null || shopcode.isEmpty())
            shopcode = userService.getdefaultshopcode();

        if (isLocalShop(shopcode)) {
            authenticate(username, password, shopcode);
            switch (type.toLowerCase()) {
                case "object":
                    return ResponseEntity.ok(service.runSelectSingle(request.getSql(), request.getParams()));
                case "report":
                    return ResponseEntity
                            .ok(service.getReportAuto(request.getSql(), request.getTablename(), request.getParams()));
                case "check":
    boolean valid = service.isQueryValid(request.getSql(), request.getParams());
    return ResponseEntity.ok(valid);
                case "list":
                default:
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write(service.runSelectJson(request.getSql(), request.getParams()));
                    return null;
            }
        }

        String remotePath = "api/query/execute?type=" + type;

        switch (type.toLowerCase()) {
            case "object":
                return remoteFetcher.fetchRemoteGeneric(
                        shopcode, remotePath, HttpMethod.POST, request, username, password,
                        new ParameterizedTypeReference<Map<String, Object>>() {});
            case "report":
                return remoteFetcher.fetchRemoteGeneric(
                        shopcode, remotePath, HttpMethod.POST, request, username, password,
                        new ParameterizedTypeReference<Map<String, Object>>() {});
            case "check":
                return remoteFetcher.fetchRemoteGeneric(
                        shopcode, remotePath, HttpMethod.POST, request, username, password,
                        new ParameterizedTypeReference<Boolean>() {});
            case "list":
            default:
                ResponseEntity<String> remoteResponse = remoteFetcher.fetchRemoteRawJson(
                        shopcode, remotePath, HttpMethod.POST, request, username, password);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(remoteResponse.getBody());
                return null;
        }
    }
    
    

    @PostMapping(value = "/executeyear", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> executeYearQuery(
            @RequestHeader("username") String username,
            @RequestHeader("password") String password,
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "shopcode", required = false) String shopcode,
            @RequestParam(value = "type", defaultValue = "list") String type,
            @RequestBody DynamicQueryRequest request,
            HttpServletResponse response) throws IOException {

        if (shopcode == null || shopcode.isEmpty())
            shopcode = userService.getdefaultshopcode();

        if (isLocalShop(shopcode)) {
            authenticate(username, password, shopcode);
            switch (type.toLowerCase()) 
            {
                case "object":
                    return ResponseEntity.ok(service.runSelectSingleYear(request.getSql(), request.getParams(),year));
                case "report":
                    return ResponseEntity
                            .ok(service.getReportAutoYear(request.getSql(), request.getTablename(), request.getParams(),year));
                case "check":
                    boolean valid = service.isQueryValidYear(request.getSql(), request.getParams(), year);
                    return ResponseEntity.ok(valid);
                case "list":
                default:
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write(service.runSelectJsonYear(request.getSql(), request.getParams(), year));
                    return null;
            }
        }

        String remotePath = "api/query/executeyear?type=" + type + (year != null ? "&year=" + year : "");

        switch (type.toLowerCase()) {
            case "object":
                return remoteFetcher.fetchRemoteGeneric(
                        shopcode, remotePath, HttpMethod.POST, request, username, password,
                        new ParameterizedTypeReference<Map<String, Object>>() {});
            case "report":
                return remoteFetcher.fetchRemoteGeneric(
                        shopcode, remotePath, HttpMethod.POST, request, username, password,
                        new ParameterizedTypeReference<Map<String, Object>>() {});
            case "check":
                return remoteFetcher.fetchRemoteGeneric(
                        shopcode, remotePath, HttpMethod.POST, request, username, password,
                        new ParameterizedTypeReference<Boolean>() {});
            case "list":
            default:
                ResponseEntity<String> remoteResponse = remoteFetcher.fetchRemoteRawJson(
                        shopcode, remotePath, HttpMethod.POST, request, username, password);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(remoteResponse.getBody());
                return null;
        }
    }
}