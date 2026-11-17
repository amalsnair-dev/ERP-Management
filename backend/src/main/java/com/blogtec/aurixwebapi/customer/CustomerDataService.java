package com.blogtec.aurixwebapi.customer;

import java.util.HashMap;
import java.util.List;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.http.HttpResponse;
import java.util.Map;

import com.blogtec.aurixwebapi.config.IpConfig;
import com.blogtec.aurixwebapi.dto.CrmCreateDTO;
import com.blogtec.aurixwebapi.dto.GetCustDataDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import com.blogtec.aurixwebapi.dto.CrmDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class CustomerDataService {

    private static final Logger logger = LoggerFactory.getLogger(CustomerDataService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private GetCustDataDto getCustDataDto;

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    // ---------------------------------------------------------
    // Create CRM Customer
    // ---------------------------------------------------------
    public String createCrmCustomer(CrmCreateDTO crmdata) throws Exception {

        String baseUrl = IpConfig.projectSchemeUrl;

        String crmCode = getCrmCode();
        Map<String, Object> discount = getDiscountSettings();
        Map<String, String> country = getDefaultCountry();

        int shopid = getShopId(baseUrl, crmdata.getShopcode());

        int value = ((Number) discount.get("amount")).intValue();
        boolean flag = (Boolean) discount.get("flag");

        Map<String, Object> crmRequest = new HashMap<>();

        crmRequest.put("custid", crmCode);
        crmRequest.put("name", crmdata.getName());
        crmRequest.put("add1", crmdata.getAdd1());
        crmRequest.put("add2", crmdata.getAdd2());
        crmRequest.put("add3", crmdata.getAdd3());
        crmRequest.put("mob", crmdata.getMob());
        crmRequest.put("place", crmdata.getPlace());
        crmRequest.put("pan", crmdata.getPan());
        crmRequest.put("gstin", crmdata.getGstin());
        crmRequest.put("pincode", crmdata.getPincode());
        crmRequest.put("smanname", crmdata.getSmanname());
        crmRequest.put("aadharno", crmdata.getAadharno());
        crmRequest.put("conPerson", crmdata.getConPerson());
        

        crmRequest.put("countrycode", country.get("dialcode"));
        crmRequest.put("country", country.get("countryname"));

        crmRequest.put("dob", "1000-01-01");
        crmRequest.put("mstatus", "Single");
        crmRequest.put("lastdate", crmdata.getTodaydate());

        crmRequest.put("username", crmdata.getUsername());
        crmRequest.put("loginid", 0);
        crmRequest.put("shopid", shopid);

        crmRequest.put("manuflg", flag);
        crmRequest.put("zerocount", value);
        crmRequest.put("child", false);

        String jsonBody = mapper.writeValueAsString(crmRequest);
        return getCustDataDto.apiResponsePost(baseUrl + "crm/create", jsonBody);
    }

    // ---------------------------------------------------------
    // Update CRM Customer
    // ---------------------------------------------------------
    public String updateCrmCustomer(String crmid, Map<String, Object> crmdata) {

        try {

            String baseUrl = IpConfig.projectSchemeUrl;

            String jsonBody = mapper.writeValueAsString(crmdata);

            return getCustDataDto.apiResponsePut(
                    baseUrl + "crm/update/" + crmid,
                    jsonBody);

        } catch (Exception e) {

            return "CRM update failed : " + e.getMessage();
        }
    }

    // ---------------------------------------------------------
    // Find CRM by CustID
    // ---------------------------------------------------------
    public String findByCustId(String custid) {

        String baseUrl = IpConfig.projectSchemeUrl;

        return getCustDataDto.apiResponseGet(
                baseUrl + "crm/find-by-custid?custid=" + custid);
    }

    // ---------------------------------------------------------
    // Find CRM by Mobile
    // ---------------------------------------------------------
    public String findByMobile(String mobile) {

        String baseUrl = IpConfig.projectSchemeUrl;

        return getCustDataDto.apiResponseGet(
                baseUrl + "crm/find-by-mobile?mob=" + mobile);
    }

    // ---------------------------------------------------------
    // Helper Methods
    // ---------------------------------------------------------

    private String getCrmCode() {

        return jdbcTemplate.queryForObject(
                "select value from company where key='crmcode'",
                String.class);
    }

    private Map<String, Object> getDiscountSettings() {

        return jdbcTemplate.queryForMap(
                "SELECT amount, flag FROM setdiscount WHERE details='CRM ID'");
    }

    private int getShopId(String baseUrl, String shopcode) {

        try {

            String response = getCustDataDto.apiResponseGet(
                    baseUrl + "shopdetails/find-shopcode/" + shopcode);

            ObjectMapper mapper = new ObjectMapper();

            List<Map<String, Object>> shops = mapper.readValue(response,
                    new TypeReference<List<Map<String, Object>>>() {
                    });

            if (!shops.isEmpty()) {

                return ((Number) shops.get(0).get("shopId")).intValue();
            }

        } catch (Exception e) {
            logger.error("Failed to fetch default shop code: {}", e.getMessage(), e);
        }

        return 0;
    }

    private Map<String, String> getDefaultCountry() {

        Map<String, String> result = new HashMap<>();

        try {

            String baseUrl = IpConfig.projectSchemeUrl;

            String response = getCustDataDto.apiResponseGet(
                    baseUrl + "countrymaster/find-by-defaultflag?defaultflag=true");

            List<Map<String, Object>> countries = mapper.readValue(response,
                    new TypeReference<List<Map<String, Object>>>() {
                    });

            if (!countries.isEmpty()) {

                result.put("dialcode", countries.get(0).get("dialcode").toString());
                result.put("countryname", countries.get(0).get("countryname").toString());
            }

        } catch (Exception e) {

            result.put("dialcode", "");
            result.put("countryname", "");
        }

        return result;
    }


    private static final String CRM_ALL_QUERY = "select name,custid,add1,place,mob,crmid from crm";

    // ---------------------------------------------------------
    // Paged + Searchable CRM list (for frontend tables)
    // ---------------------------------------------------------
    private static final String CRM_PAGE_COLUMNS = "select name,custid,add1,place,mob,crmid from crm";
    private static final String CRM_SEARCH_WHERE =
            " where (name ilike :search or custid ilike :search or mob like :search)";

    public Map<String, Object> findCrmPaged(int page, int size, String search) {

        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        int offset = (safePage - 1) * safeSize;

        boolean hasSearch = search != null && !search.isBlank();
        String where = hasSearch ? CRM_SEARCH_WHERE : "";

        Map<String, Object> params = new HashMap<>();
        if (hasSearch) {
            params.put("search", "%" + search.trim() + "%");
        }

        // No search  -> newest customers first (uses PK index, very fast)
        // With search -> names STARTING with the term first, then other matches A-Z
        String orderBy = hasSearch
                ? " order by (name ilike :prefix) desc, name, crmid"
                : " order by crmid desc";

        Map<String, Object> result = new HashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);

        try {
            String baseUrl = IpConfig.projectSchemeUrl;

            // 1. Total count
            long total = 0;
            Map<String, Object> countBody = new HashMap<>();
            countBody.put("sql", "select count(*) as total from crm" + where);
            countBody.put("params", params);
            String countResp = getCustDataDto.apiResponsePost(
                    baseUrl + "query/execute?type=object", mapper.writeValueAsString(countBody));
            if (countResp != null && !countResp.isBlank()) {
                Map<String, Object> countMap = mapper.readValue(countResp,
                        new TypeReference<Map<String, Object>>() {});
                Object t = countMap.get("total");
                if (t instanceof Number n) {
                    total = n.longValue();
                }
            }

            // 2. Page data (only 20 rows travel over the wire)
            List<CrmDTO> content = List.of();
            if (total > 0 && offset < total) {
                Map<String, Object> pageParams = new HashMap<>(params);
                pageParams.put("lim", safeSize);
                pageParams.put("off", offset);
                if (hasSearch) {
                    pageParams.put("prefix", search.trim() + "%");
                }

                Map<String, Object> dataBody = new HashMap<>();
                dataBody.put("sql", CRM_PAGE_COLUMNS + where
                        + orderBy + " limit :lim offset :off");
                dataBody.put("params", pageParams);

                String dataResp = getCustDataDto.apiResponsePost(
                        baseUrl + "query/execute?type=list", mapper.writeValueAsString(dataBody));
                if (dataResp != null && !dataResp.isBlank() && dataResp.trim().startsWith("[")) {
                    content = mapper.readValue(dataResp, new TypeReference<List<CrmDTO>>() {});
                }
            }

            result.put("content", content);
            result.put("totalElements", total);
            result.put("totalPages", (int) Math.ceil((double) total / safeSize));

        } catch (Exception e) {
            logger.error("Failed to fetch paged CRM records: {}", e.getMessage(), e);
            result.put("content", List.of());
            result.put("totalElements", 0);
            result.put("totalPages", 0);
        }

        return result;
    }

    public boolean streamCrmByAll(OutputStream outputStream) {
        try {
            String baseUrl = IpConfig.projectSchemeUrl;
            String apiUrl = baseUrl + "query/execute?type=list";
            String jsonBody = mapper.writeValueAsString(Map.of("sql", CRM_ALL_QUERY));
            return getCustDataDto.streamApiResponsePost(apiUrl, jsonBody, outputStream);
        } catch (Exception e) {
            logger.error("Failed to stream CRM records: {}", e.getMessage(), e);
            return false;
        }
    }

    public List<CrmDTO> findCrmByAll() {
        try {
            String baseUrl = IpConfig.projectSchemeUrl;
            String apiUrl = baseUrl + "query/execute?type=list";
            String jsonBody = mapper.writeValueAsString(Map.of("sql", CRM_ALL_QUERY));

            HttpResponse<InputStream> resp = getCustDataDto.apiResponsePostStream(apiUrl, jsonBody);

            if (resp.statusCode() != HttpURLConnection.HTTP_OK) {
                logger.error("Failed to fetch CRM records: Status {}", resp.statusCode());
                return List.of();
            }

            try (InputStream in = resp.body()) {
                return mapper.readValue(in, new TypeReference<List<CrmDTO>>() {});
            }

        } catch (Exception e) {
            logger.error("Failed to fetch CRM records via query: {}", e.getMessage(), e);
            return List.of();
        }
    }
}
