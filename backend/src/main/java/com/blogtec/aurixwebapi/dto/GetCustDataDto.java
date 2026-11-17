package com.blogtec.aurixwebapi.dto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


import org.springframework.stereotype.Component;

import com.blogtec.aurixwebapi.config.ServerPortConfig;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
public class GetCustDataDto {

    private static final Logger logger = LoggerFactory.getLogger(GetCustDataDto.class);


    private final String username = ServerPortConfig.getUsername();
    private final String password = ServerPortConfig.getPassword();
    private final int timeoutSeconds = ServerPortConfig.getTimeoutSeconds();

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(ServerPortConfig.getTimeoutSeconds()))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();





    private HttpRequest.Builder baseRequest(String apiUrl) {
        return HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("username", username)
                .header("password", password)
                .header("Content-Type", "application/json");
    }

    // ---------------------------------------
    // GET
    // ---------------------------------------
    public String apiResponseGet(String apiUrl) {
        try {

            HttpRequest request = baseRequest(apiUrl)
                    .GET()
                    .build();

            HttpResponse<String> resp =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() == HttpURLConnection.HTTP_OK) {
                return resp.body();
            }

            logger.error("GET failed: {} | Status: {}", apiUrl, resp.statusCode());
            return "";

        } catch (Exception e) {
            logger.error("GET Error: {}", apiUrl, e);
            return "";
        }
    }

    // ---------------------------------------
    // POST
    // ---------------------------------------
    public String apiResponsePost(String apiUrl, String jsonBody) {
        try {

            HttpRequest request = baseRequest(apiUrl)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> resp =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() == HttpURLConnection.HTTP_OK ||
                    resp.statusCode() == HttpURLConnection.HTTP_CREATED) {
                return resp.body();
            }

            logger.error("POST failed: {} | Status: {}", apiUrl, resp.statusCode());
            return "";

        } catch (Exception e) {
            logger.error("POST Error: {}", apiUrl, e);
            return "";
        }
    }

    // ---------------------------------------
    // PUT
    // ---------------------------------------
    public String apiResponsePut(String apiUrl, String jsonBody) {
        try {

            HttpRequest request = baseRequest(apiUrl)
                    .PUT(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> resp =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() == HttpURLConnection.HTTP_OK) {
                return resp.body();
            }

            logger.error("PUT failed: {} | Status: {}", apiUrl, resp.statusCode());
            return "";

        } catch (Exception e) {
            logger.error("PUT Error: {}", apiUrl, e);
            return "";
        }
    }

    // ---------------------------------------
    // DELETE
    // ---------------------------------------
    public String apiResponseDelete(String apiUrl) {
        try {

            HttpRequest request = baseRequest(apiUrl)
                    .DELETE()
                    .build();

            HttpResponse<String> resp =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() == HttpURLConnection.HTTP_OK) {
                return resp.body();
            }

            logger.error("DELETE failed: {} | Status: {}", apiUrl, resp.statusCode());
            return "";

        } catch (Exception e) {
            logger.error("DELETE Error: {}", apiUrl, e);
            return "";
        }
    }

    // ---------------------------------------
    // STREAM POST (Zero-Heap for Large Datasets)
    // ---------------------------------------
    public boolean streamApiResponsePost(String apiUrl, String jsonBody, OutputStream outputStream) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .timeout(Duration.ofSeconds(Math.max(timeoutSeconds, 180)))
                    .header("username", username)
                    .header("password", password)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<InputStream> resp =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());

            if (resp.statusCode() == HttpURLConnection.HTTP_OK) {
                try (InputStream in = resp.body()) {
                    in.transferTo(outputStream);
                    outputStream.flush();
                    return true;
                }
            }

            logger.error("streamApiResponsePost failed: {} | Status: {}", apiUrl, resp.statusCode());
            return false;

        } catch (Exception e) {
            logger.error("streamApiResponsePost Error: {}", apiUrl, e);
            return false;
        }
    }

    public HttpResponse<InputStream> apiResponsePostStream(String apiUrl, String jsonBody) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .timeout(Duration.ofSeconds(Math.max(timeoutSeconds, 180)))
                .header("username", username)
                .header("password", password)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        return httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
    }
}
