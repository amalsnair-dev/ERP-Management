package com.blogtec.aurixwebapi.utils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.blogtec.aurixwebapi.config.ServerInfo;
import com.blogtec.aurixwebapi.configuration.RemoteBranchException;
import com.blogtec.aurixwebapi.user.UserService;

/**
 * ✅ RemoteDataFetcher
 * Handles inter-branch REST communication safely with authentication,
 * logging, and consistent response wrapping.
 */
@Component
public class RemoteDataFetcher {

    private final RestTemplate restTemplate;
    private final UserService userService;
    @Value("${server.servlet.context-path:/aurixwebapi}")
    private String contextPath;

    @Autowired
    public RemoteDataFetcher(RestTemplate restTemplate, UserService userService) {
        this.restTemplate = restTemplate;
        this.userService = userService;
    }

    /** ------------------ URL + HEADER HELPERS ------------------ **/

    private String buildUrl(String ip, String path, String shopcode) {
        if (!path.startsWith("/"))
            path = "/" + path;

        // Default to http unless explicitly specified otherwise in the IP
        String protocol = "http://";
        if (ip.startsWith("https://")) {
            protocol = "https://";
        }

        String cleanIp = ip.replace("http://", "").replace("https://", "");
        if (cleanIp.endsWith("/")) {
            cleanIp = cleanIp.substring(0, cleanIp.length() - 1);
        }

        // Only append port if not already present in the IP
        String portSuffix = "";
        if (!cleanIp.contains(":")) {
            int port = ServerInfo.getServerPort();
            if (port == 0) port = 8080; // Standard fallback
            
            if (!(port == 80 || (protocol.equals("https://") && port == 443))) {
                portSuffix = ":" + port;
            }
        }

        String url = protocol + cleanIp + portSuffix + contextPath + path;

        if (shopcode != null && !shopcode.isBlank()) {
            String encodedShopcode = "shopcode=" + encode(shopcode);
            if (!url.contains("shopcode=")) {
                url += url.contains("?") ? "&" + encodedShopcode : "?" + encodedShopcode;
            }
        }
        return url;
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

   
	@SuppressWarnings("null")
	private HttpHeaders buildHeaders(String username, String password) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN,
                MediaType.APPLICATION_OCTET_STREAM, MediaType.APPLICATION_PDF));
        headers.add("username", username != null ? username : "");
        headers.add("password", password != null ? password : "");
        return headers;
    }

    /** ------------------ GENERIC OBJECT FETCH ------------------ **/

   
	@SuppressWarnings("null")
	public ResponseEntity<?> fetchRemoteObject(String shopcode, String path, HttpMethod method, Object body,
            String username, String password) {
        String ip = null;
        String url = null;
        try {
            ip = userService.getipbyShopcode(shopcode);
            url = buildUrl(ip, path, shopcode);

            HttpEntity<Object> request = new HttpEntity<>(body, buildHeaders(username, password));
            ResponseEntity<String> response = restTemplate.exchange(url, method, request, String.class);

            String bodyStr = cleanXmlWrapper(response.getBody());

            return ResponseEntity.status(response.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(bodyStr);

        } catch (HttpClientErrorException.Forbidden e) {
            throw new RemoteBranchException("Access denied at remote branch", HttpStatus.FORBIDDEN, shopcode, path,
                    url);
        } catch (RestClientException e) {
            throw new RemoteBranchException("Remote branch unreachable or service unavailable",
                    HttpStatus.SERVICE_UNAVAILABLE, shopcode, path, url);
        }
    }

    public ResponseEntity<?> fetchRemoteObject(String shopcode, String path, HttpMethod method, Object requestBody)
            throws RemoteBranchException {
        return fetchRemoteObject(shopcode, path, method, requestBody, null, null);
    }

    private String cleanXmlWrapper(String input) {
        if (input == null)
            return null;
        if (input.matches("^<\\w+>.*</\\w+>$")) {
            return input.replaceAll("^<[^>]+>", "").replaceAll("</[^>]+>$", "").trim();
        }
        return input;
    }

    /** ------------------ FETCH LIST ------------------ **/

    public <T> ResponseEntity<List<T>> fetchRemoteList(String shopcode, String path, String username, String password,
            ParameterizedTypeReference<List<T>> responseType) throws RemoteBranchException {
        String ip = null;
        String url = null;
        try {
            ip = userService.getipbyShopcode(shopcode);
            url = buildUrl(ip, path, shopcode);
           
			@SuppressWarnings("null")
			HttpEntity<Void> request = new HttpEntity<>(buildHeaders(username, password));
           
			@SuppressWarnings("null")
			ResponseEntity<List<T>> response = restTemplate.exchange(url, HttpMethod.GET, request, responseType);
            List<T> list = response.getBody();
            if (list != null)
                list.removeIf(item -> item == null);

            return ResponseEntity.ok(list);

        } catch (HttpClientErrorException.Forbidden e) {
            throw new RemoteBranchException("Access denied at remote branch", HttpStatus.FORBIDDEN, shopcode, path,
                    url);
        } catch (RestClientException e) {
            throw new RemoteBranchException("Remote branch unreachable or service unavailable",
                    HttpStatus.SERVICE_UNAVAILABLE, shopcode, path, url);
        }
    }

    public <T> ResponseEntity<List<T>> fetchRemoteList(String shopcode, String path,
            ParameterizedTypeReference<List<T>> responseType) throws RemoteBranchException {
        return fetchRemoteList(shopcode, path, null, null, responseType);
    }

    public ResponseEntity<List<Map<String, Object>>> fetchRemoteList(String shopcode, String path,
            String username, String password) throws RemoteBranchException {
        return fetchRemoteList(shopcode, path, username, password,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {
                });
    }

    public ResponseEntity<List<Map<String, Object>>> fetchRemoteList(String shopcode, String path)
            throws RemoteBranchException {
        return fetchRemoteList(shopcode, path, null, null);
    }

    /** ------------------ DELETE REMOTE OBJECT ------------------ **/

   
	@SuppressWarnings("null")
	public ResponseEntity<String> deleteRemoteObject(String shopcode, String path,
            String username, String password) throws RemoteBranchException {
        String ip = null;
        String url = null;
        try {
            ip = userService.getipbyShopcode(shopcode);
            url = buildUrl(ip, path, shopcode);

            HttpEntity<Void> request = new HttpEntity<>(buildHeaders(username, password));
            restTemplate.exchange(url, HttpMethod.DELETE, request, Void.class);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"message\":\"Deleted successfully from remote branch\"}");

        } catch (RestClientException e) {
            throw new RemoteBranchException("Failed to delete from remote shop", HttpStatus.SERVICE_UNAVAILABLE,
                    shopcode, path, url);
        }
    }

    /** ------------------ FETCH FILE ------------------ **/

   
	@SuppressWarnings("null")
	public ResponseEntity<byte[]> fetchRemoteFile(String shopcode, String path,
            String username, String password) throws RemoteBranchException {
        String ip = null;
        String url = null;
        try {
            ip = userService.getipbyShopcode(shopcode);
            url = buildUrl(ip, path, shopcode);

            HttpEntity<Void> request = new HttpEntity<>(buildHeaders(username, password));
            return restTemplate.exchange(url, HttpMethod.GET, request, byte[].class);

        } catch (RestClientException e) {
            throw new RemoteBranchException("Failed to fetch remote file", HttpStatus.SERVICE_UNAVAILABLE, shopcode,
                    path, url);
        }
    }

    public ResponseEntity<byte[]> fetchRemoteFile(String shopcode, String path) throws RemoteBranchException {
        return fetchRemoteFile(shopcode, path, null, null);
    }

    /**
     * Generic remote fetcher for any response type.
     * Use when your response is not simply List<T>.
     */
    public <T> ResponseEntity<T> fetchRemoteGeneric(
            String shopcode,
            String path,
            HttpMethod method,
            Object body,
            String username,
            String password,
            ParameterizedTypeReference<T> responseType) {
        String ip = null;
        String url = null;
        try {
            ip = userService.getipbyShopcode(shopcode);
            url = buildUrl(ip, path, shopcode);

            HttpEntity<Object> request = new HttpEntity<>(body, buildHeaders(username, password));
           
			@SuppressWarnings("null")
			ResponseEntity<T> response = restTemplate.exchange(url, method, request, responseType);

            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());

        } catch (HttpClientErrorException.Forbidden e) {
            throw new RemoteBranchException("Access denied at remote branch", HttpStatus.FORBIDDEN, shopcode, path,
                    url);
        } catch (RestClientException e) {
            throw new RemoteBranchException("Remote branch unreachable or service unavailable",
                    HttpStatus.SERVICE_UNAVAILABLE, shopcode, path, url);
        }
    }

    public <T> ResponseEntity<T> fetchRemoteGeneric(String shopcode, String path, HttpMethod method, Object body,
            ParameterizedTypeReference<T> responseType) throws RemoteBranchException {
        return fetchRemoteGeneric(shopcode, path, method, body, null, null, responseType);
    }

    /** ------------------ RAW JSON ------------------ **/

   
	@SuppressWarnings("null")
	public ResponseEntity<String> fetchRemoteRawJson(String shopcode, String path, HttpMethod method,
            Object body, String username, String password) {
        String ip = null;
        String url = null;
        try {
            ip = userService.getipbyShopcode(shopcode);
            url = buildUrl(ip, path, shopcode);

            HttpEntity<Object> request = new HttpEntity<>(body, buildHeaders(username, password));
            ResponseEntity<String> response = restTemplate.exchange(url, method, request, String.class);

            return ResponseEntity.status(response.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response.getBody());

        } catch (RestClientException e) {
            throw new RemoteBranchException("Failed to fetch remote data", HttpStatus.SERVICE_UNAVAILABLE, shopcode,
                    path, url);
        }
    }

    public ResponseEntity<String> fetchRemoteRawJson(String shopcode, String path, HttpMethod method, Object body)
            throws RemoteBranchException {
        return fetchRemoteRawJson(shopcode, path, method, body, null, null);
    }

    /** ------------------ USER CONTROLLER HELPERS ------------------ **/

    public ResponseEntity<String> fetchRemoteUser(String shopcode, String path, HttpMethod method, Object body,
            String username, String password) {
        // Ensure path starts with /user if not already there
        String fullPath = path.startsWith("/user") ? path : "/user" + (path.startsWith("/") ? path : "/" + path);
        return fetchRemoteRawJson(shopcode, fullPath, method, body, username, password);
    }

    public ResponseEntity<String> fetchRemoteUser(String shopcode, String path, HttpMethod method, Object body) {
        return fetchRemoteUser(shopcode, path, method, body, null, null);
    }

    public ResponseEntity<String> fetchRemoteApiUser(String shopcode, String path, HttpMethod method, Object body,
            String username, String password) {
        // Ensure path starts with /apiuser if not already there
        String fullPath = path.startsWith("/apiuser") ? path : "/apiuser" + (path.startsWith("/") ? path : "/" + path);
        return fetchRemoteRawJson(shopcode, fullPath, method, body, username, password);
    }

    public ResponseEntity<String> fetchRemoteApiUser(String shopcode, String path, HttpMethod method, Object body) {
        return fetchRemoteApiUser(shopcode, path, method, body, null, null);
    }

    /** ------------------ SALES CONTROLLER HELPERS ------------------ **/

    public ResponseEntity<String> fetchRemoteSales(String shopcode, String path, HttpMethod method, Object body,
            String username, String password) {
        String fullPath = path.startsWith("/sales") ? path : "/sales" + (path.startsWith("/") ? path : "/" + path);
        return fetchRemoteRawJson(shopcode, fullPath, method, body, username, password);
    }

    public ResponseEntity<String> fetchRemoteSales(String shopcode, String path, HttpMethod method, Object body) {
        return fetchRemoteSales(shopcode, path, method, body, null, null);
    }

    public ResponseEntity<List<Map<String, Object>>> fetchRemoteSalesList(String shopcode, String path,
            String username, String password) throws RemoteBranchException {
        String fullPath = path.startsWith("/sales") ? path : "/sales" + (path.startsWith("/") ? path : "/" + path);
        return fetchRemoteList(shopcode, fullPath, username, password);
    }

    public ResponseEntity<List<Map<String, Object>>> fetchRemoteSalesList(String shopcode, String path)
            throws RemoteBranchException {
        return fetchRemoteSalesList(shopcode, path, null, null);
    }
}
