package com.blogtec.aurixwebapi.metadata;

import com.blogtec.aurixwebapi.config.IpConfig;
import com.blogtec.aurixwebapi.dto.GetCustDataDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/metadata")
public class MetadataController {

    private static final Logger logger = LoggerFactory.getLogger(MetadataController.class);

    @Autowired
    private GetCustDataDto getCustDataDto;

    private final ObjectMapper mapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    // Static mapping for Currency Info (Code and Symbol) based on Country ISO Code
    private static final Map<String, Map<String, String>> CURRENCY_MAP = new HashMap<>();

    static 
    {
        // --- ASIA ---
        CURRENCY_MAP.put("AF", Map.of("code", "AFN", "symbol", "؋"));
        CURRENCY_MAP.put("AM", Map.of("code", "AMD", "symbol", "֏"));
        CURRENCY_MAP.put("AZ", Map.of("code", "AZN", "symbol", "₼"));
        CURRENCY_MAP.put("BD", Map.of("code", "BDT", "symbol", "৳"));
        CURRENCY_MAP.put("BT", Map.of("code", "BTN", "symbol", "Nu."));
        CURRENCY_MAP.put("BN", Map.of("code", "BND", "symbol", "B$"));
        CURRENCY_MAP.put("KH", Map.of("code", "KHR", "symbol", "៛"));
        CURRENCY_MAP.put("CN", Map.of("code", "CNY", "symbol", "¥"));
        CURRENCY_MAP.put("GE", Map.of("code", "GEL", "symbol", "₾"));
        CURRENCY_MAP.put("HK", Map.of("code", "HKD", "symbol", "HK$"));
        CURRENCY_MAP.put("IN", Map.of("code", "INR", "symbol", "₹"));
        CURRENCY_MAP.put("ID", Map.of("code", "IDR", "symbol", "Rp"));
        CURRENCY_MAP.put("JP", Map.of("code", "JPY", "symbol", "¥"));
        CURRENCY_MAP.put("KZ", Map.of("code", "KZT", "symbol", "₸"));
        CURRENCY_MAP.put("KG", Map.of("code", "KGS", "symbol", "с"));
        CURRENCY_MAP.put("LA", Map.of("code", "LAK", "symbol", "₭"));
        CURRENCY_MAP.put("MO", Map.of("code", "MOP", "symbol", "P"));
        CURRENCY_MAP.put("MY", Map.of("code", "MYR", "symbol", "RM"));
        CURRENCY_MAP.put("MV", Map.of("code", "MVR", "symbol", "Rf"));
        CURRENCY_MAP.put("MN", Map.of("code", "MNT", "symbol", "₮"));
        CURRENCY_MAP.put("MM", Map.of("code", "MMK", "symbol", "K"));
        CURRENCY_MAP.put("NP", Map.of("code", "NPR", "symbol", "रू"));
        CURRENCY_MAP.put("PK", Map.of("code", "PKR", "symbol", "Rs"));
        CURRENCY_MAP.put("PH", Map.of("code", "PHP", "symbol", "₱"));
        CURRENCY_MAP.put("SG", Map.of("code", "SGD", "symbol", "S$"));
        CURRENCY_MAP.put("KR", Map.of("code", "KRW", "symbol", "₩"));
        CURRENCY_MAP.put("LK", Map.of("code", "LKR", "symbol", "Rs"));
        CURRENCY_MAP.put("TW", Map.of("code", "TWD", "symbol", "NT$"));
        CURRENCY_MAP.put("TJ", Map.of("code", "TJS", "symbol", "SM"));
        CURRENCY_MAP.put("TH", Map.of("code", "THB", "symbol", "฿"));
        CURRENCY_MAP.put("TL", Map.of("code", "USD", "symbol", "$"));
        CURRENCY_MAP.put("TM", Map.of("code", "TMT", "symbol", "T"));
        CURRENCY_MAP.put("UZ", Map.of("code", "UZS", "symbol", "so'm"));
        CURRENCY_MAP.put("VN", Map.of("code", "VND", "symbol", "₫"));

        // --- MIDDLE EAST ---
        CURRENCY_MAP.put("BH", Map.of("code", "BHD", "symbol", ".د.ب"));
        CURRENCY_MAP.put("IR", Map.of("code", "IRR", "symbol", "﷼"));
        CURRENCY_MAP.put("IQ", Map.of("code", "IQD", "symbol", "ع.د"));
        CURRENCY_MAP.put("IL", Map.of("code", "ILS", "symbol", "₪"));
        CURRENCY_MAP.put("JO", Map.of("code", "JOD", "symbol", "د.ا"));
        CURRENCY_MAP.put("KW", Map.of("code", "KWD", "symbol", "د.ك"));
        CURRENCY_MAP.put("LB", Map.of("code", "LBP", "symbol", "ل.ل"));
        CURRENCY_MAP.put("OM", Map.of("code", "OMR", "symbol", "ر.ع."));
        CURRENCY_MAP.put("PS", Map.of("code", "ILS", "symbol", "₪"));
        CURRENCY_MAP.put("QA", Map.of("code", "QAR", "symbol", "ر.ق"));
        CURRENCY_MAP.put("SA", Map.of("code", "SAR", "symbol", "﷼"));
        CURRENCY_MAP.put("SY", Map.of("code", "SYP", "symbol", "£"));
        CURRENCY_MAP.put("TR", Map.of("code", "TRY", "symbol", "₺"));
        CURRENCY_MAP.put("AE", Map.of("code", "AED", "symbol", "د.إ"));
        CURRENCY_MAP.put("YE", Map.of("code", "YER", "symbol", "﷼"));

        // --- EUROPE ---
        CURRENCY_MAP.put("AL", Map.of("code", "ALL", "symbol", "L"));
        CURRENCY_MAP.put("AD", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("AT", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("BY", Map.of("code", "BYN", "symbol", "Br"));
        CURRENCY_MAP.put("BE", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("BA", Map.of("code", "BAM", "symbol", "KM"));
        CURRENCY_MAP.put("BG", Map.of("code", "BGN", "symbol", "лв"));
        CURRENCY_MAP.put("HR", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("CY", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("CZ", Map.of("code", "CZK", "symbol", "Kč"));
        CURRENCY_MAP.put("DK", Map.of("code", "DKK", "symbol", "kr"));
        CURRENCY_MAP.put("EE", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("FI", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("FR", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("DE", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("GR", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("HU", Map.of("code", "HUF", "symbol", "Ft"));
        CURRENCY_MAP.put("IS", Map.of("code", "ISK", "symbol", "kr"));
        CURRENCY_MAP.put("IE", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("IT", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("LV", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("LI", Map.of("code", "CHF", "symbol", "CHF"));
        CURRENCY_MAP.put("LT", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("LU", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("MT", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("MD", Map.of("code", "MDL", "symbol", "L"));
        CURRENCY_MAP.put("MC", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("ME", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("NL", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("MK", Map.of("code", "MKD", "symbol", "ден"));
        CURRENCY_MAP.put("NO", Map.of("code", "NOK", "symbol", "kr"));
        CURRENCY_MAP.put("PL", Map.of("code", "PLN", "symbol", "zł"));
        CURRENCY_MAP.put("PT", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("RO", Map.of("code", "RON", "symbol", "lei"));
        CURRENCY_MAP.put("RU", Map.of("code", "RUB", "symbol", "₽"));
        CURRENCY_MAP.put("SM", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("RS", Map.of("code", "RSD", "symbol", "дин."));
        CURRENCY_MAP.put("SK", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("SI", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("ES", Map.of("code", "EUR", "symbol", "€"));
        CURRENCY_MAP.put("SE", Map.of("code", "SEK", "symbol", "kr"));
        CURRENCY_MAP.put("CH", Map.of("code", "CHF", "symbol", "CHF"));
        CURRENCY_MAP.put("UA", Map.of("code", "UAH", "symbol", "₴"));
        CURRENCY_MAP.put("GB", Map.of("code", "GBP", "symbol", "£"));
        CURRENCY_MAP.put("VA", Map.of("code", "EUR", "symbol", "€"));

        // --- AMERICAS ---
        CURRENCY_MAP.put("AG", Map.of("code", "XCD", "symbol", "$"));
        CURRENCY_MAP.put("AR", Map.of("code", "ARS", "symbol", "$"));
        CURRENCY_MAP.put("BS", Map.of("code", "BSD", "symbol", "$"));
        CURRENCY_MAP.put("BB", Map.of("code", "BBD", "symbol", "$"));
        CURRENCY_MAP.put("BZ", Map.of("code", "BZD", "symbol", "$"));
        CURRENCY_MAP.put("BO", Map.of("code", "BOB", "symbol", "Bs."));
        CURRENCY_MAP.put("BR", Map.of("code", "BRL", "symbol", "R$"));
        CURRENCY_MAP.put("CA", Map.of("code", "CAD", "symbol", "C$"));
        CURRENCY_MAP.put("CL", Map.of("code", "CLP", "symbol", "$"));
        CURRENCY_MAP.put("CO", Map.of("code", "COP", "symbol", "$"));
        CURRENCY_MAP.put("CR", Map.of("code", "CRC", "symbol", "₡"));
        CURRENCY_MAP.put("CU", Map.of("code", "CUP", "symbol", "$"));
        CURRENCY_MAP.put("DM", Map.of("code", "XCD", "symbol", "$"));
        CURRENCY_MAP.put("DO", Map.of("code", "DOP", "symbol", "RD$"));
        CURRENCY_MAP.put("EC", Map.of("code", "USD", "symbol", "$"));
        CURRENCY_MAP.put("SV", Map.of("code", "USD", "symbol", "$"));
        CURRENCY_MAP.put("GD", Map.of("code", "XCD", "symbol", "$"));
        CURRENCY_MAP.put("GT", Map.of("code", "GTQ", "symbol", "Q"));
        CURRENCY_MAP.put("GY", Map.of("code", "GYD", "symbol", "$"));
        CURRENCY_MAP.put("HT", Map.of("code", "HTG", "symbol", "G"));
        CURRENCY_MAP.put("HN", Map.of("code", "HNL", "symbol", "L"));
        CURRENCY_MAP.put("JM", Map.of("code", "JMD", "symbol", "$"));
        CURRENCY_MAP.put("MX", Map.of("code", "MXN", "symbol", "$"));
        CURRENCY_MAP.put("NI", Map.of("code", "NIO", "symbol", "C$"));
        CURRENCY_MAP.put("PA", Map.of("code", "PAB", "symbol", "B/."));
        CURRENCY_MAP.put("PY", Map.of("code", "PYG", "symbol", "₲"));
        CURRENCY_MAP.put("PE", Map.of("code", "PEN", "symbol", "S/."));
        CURRENCY_MAP.put("KN", Map.of("code", "XCD", "symbol", "$"));
        CURRENCY_MAP.put("LC", Map.of("code", "XCD", "symbol", "$"));
        CURRENCY_MAP.put("VC", Map.of("code", "XCD", "symbol", "$"));
        CURRENCY_MAP.put("SR", Map.of("code", "SRD", "symbol", "$"));
        CURRENCY_MAP.put("TT", Map.of("code", "TTD", "symbol", "$"));
        CURRENCY_MAP.put("US", Map.of("code", "USD", "symbol", "$"));
        CURRENCY_MAP.put("UY", Map.of("code", "UYU", "symbol", "$"));
        CURRENCY_MAP.put("VE", Map.of("code", "VES", "symbol", "Bs.S"));

        // --- AFRICA ---
        CURRENCY_MAP.put("DZ", Map.of("code", "DZD", "symbol", "د.ج"));
        CURRENCY_MAP.put("AO", Map.of("code", "AOA", "symbol", "Kz"));
        CURRENCY_MAP.put("BJ", Map.of("code", "XOF", "symbol", "CFA"));
        CURRENCY_MAP.put("BW", Map.of("code", "BWP", "symbol", "P"));
        CURRENCY_MAP.put("BF", Map.of("code", "XOF", "symbol", "CFA"));
        CURRENCY_MAP.put("BI", Map.of("code", "BIF", "symbol", "FBu"));
        CURRENCY_MAP.put("CM", Map.of("code", "XAF", "symbol", "FCFA"));
        CURRENCY_MAP.put("CV", Map.of("code", "CVE", "symbol", "Esc"));
        CURRENCY_MAP.put("CF", Map.of("code", "XAF", "symbol", "FCFA"));
        CURRENCY_MAP.put("TD", Map.of("code", "XAF", "symbol", "FCFA"));
        CURRENCY_MAP.put("KM", Map.of("code", "KMF", "symbol", "CF"));
        CURRENCY_MAP.put("CG", Map.of("code", "XAF", "symbol", "FCFA"));
        CURRENCY_MAP.put("CD", Map.of("code", "CDF", "symbol", "FC"));
        CURRENCY_MAP.put("DJ", Map.of("code", "DJF", "symbol", "Fdj"));
        CURRENCY_MAP.put("EG", Map.of("code", "EGP", "symbol", "E£"));
        CURRENCY_MAP.put("GQ", Map.of("code", "XAF", "symbol", "FCFA"));
        CURRENCY_MAP.put("ER", Map.of("code", "ERN", "symbol", "Nfk"));
        CURRENCY_MAP.put("ET", Map.of("code", "ETB", "symbol", "Br"));
        CURRENCY_MAP.put("GA", Map.of("code", "XAF", "symbol", "FCFA"));
        CURRENCY_MAP.put("GM", Map.of("code", "GMD", "symbol", "D"));
        CURRENCY_MAP.put("GH", Map.of("code", "GHS", "symbol", "GH₵"));
        CURRENCY_MAP.put("GN", Map.of("code", "GNF", "symbol", "FG"));
        CURRENCY_MAP.put("GW", Map.of("code", "XOF", "symbol", "CFA"));
        CURRENCY_MAP.put("CI", Map.of("code", "XOF", "symbol", "CFA"));
        CURRENCY_MAP.put("KE", Map.of("code", "KES", "symbol", "KSh"));
        CURRENCY_MAP.put("LS", Map.of("code", "LSL", "symbol", "L"));
        CURRENCY_MAP.put("LR", Map.of("code", "LRD", "symbol", "$"));
        CURRENCY_MAP.put("LY", Map.of("code", "LYD", "symbol", "ل.د"));
        CURRENCY_MAP.put("MG", Map.of("code", "MGA", "symbol", "Ar"));
        CURRENCY_MAP.put("MW", Map.of("code", "MWK", "symbol", "MK"));
        CURRENCY_MAP.put("ML", Map.of("code", "XOF", "symbol", "CFA"));
        CURRENCY_MAP.put("MR", Map.of("code", "MRU", "symbol", "UM"));
        CURRENCY_MAP.put("MU", Map.of("code", "MUR", "symbol", "Rs"));
        CURRENCY_MAP.put("MA", Map.of("code", "MAD", "symbol", "MAD"));
        CURRENCY_MAP.put("MZ", Map.of("code", "MZN", "symbol", "MT"));
        CURRENCY_MAP.put("NA", Map.of("code", "NAD", "symbol", "$"));
        CURRENCY_MAP.put("NE", Map.of("code", "XOF", "symbol", "CFA"));
        CURRENCY_MAP.put("NG", Map.of("code", "NGN", "symbol", "₦"));
        CURRENCY_MAP.put("RW", Map.of("code", "RWF", "symbol", "FRw"));
        CURRENCY_MAP.put("ST", Map.of("code", "STN", "symbol", "Db"));
        CURRENCY_MAP.put("SN", Map.of("code", "XOF", "symbol", "CFA"));
        CURRENCY_MAP.put("SC", Map.of("code", "SCR", "symbol", "Rs"));
        CURRENCY_MAP.put("SL", Map.of("code", "SLL", "symbol", "Le"));
        CURRENCY_MAP.put("SO", Map.of("code", "SOS", "symbol", "S"));
        CURRENCY_MAP.put("ZA", Map.of("code", "ZAR", "symbol", "R"));
        CURRENCY_MAP.put("SS", Map.of("code", "SSP", "symbol", "£"));
        CURRENCY_MAP.put("SD", Map.of("code", "SDG", "symbol", "ج.س."));
        CURRENCY_MAP.put("SZ", Map.of("code", "SZL", "symbol", "L"));
        CURRENCY_MAP.put("TZ", Map.of("code", "TZS", "symbol", "TSh"));
        CURRENCY_MAP.put("TG", Map.of("code", "XOF", "symbol", "CFA"));
        CURRENCY_MAP.put("TN", Map.of("code", "TND", "symbol", "د.ت"));
        CURRENCY_MAP.put("UG", Map.of("code", "UGX", "symbol", "USh"));
        CURRENCY_MAP.put("ZM", Map.of("code", "ZMW", "symbol", "ZK"));
        CURRENCY_MAP.put("ZW", Map.of("code", "ZWL", "symbol", "$"));

        // --- OCEANIA ---
        CURRENCY_MAP.put("AU", Map.of("code", "AUD", "symbol", "$"));
        CURRENCY_MAP.put("FJ", Map.of("code", "FJD", "symbol", "$"));
        CURRENCY_MAP.put("KI", Map.of("code", "AUD", "symbol", "$"));
        CURRENCY_MAP.put("MH", Map.of("code", "USD", "symbol", "$"));
        CURRENCY_MAP.put("FM", Map.of("code", "USD", "symbol", "$"));
        CURRENCY_MAP.put("NR", Map.of("code", "AUD", "symbol", "$"));
        CURRENCY_MAP.put("NZ", Map.of("code", "NZD", "symbol", "$"));
        CURRENCY_MAP.put("PW", Map.of("code", "USD", "symbol", "$"));
        CURRENCY_MAP.put("PG", Map.of("code", "PGK", "symbol", "K"));
        CURRENCY_MAP.put("WS", Map.of("code", "WST", "symbol", "T"));
        CURRENCY_MAP.put("SB", Map.of("code", "SBD", "symbol", "$"));
        CURRENCY_MAP.put("TO", Map.of("code", "TOP", "symbol", "T$"));
        CURRENCY_MAP.put("TV", Map.of("code", "AUD", "symbol", "$"));
        CURRENCY_MAP.put("VU", Map.of("code", "VUV", "symbol", "VT"));
    }
    private static final Map<String, Map<String, Object>> PHONE_LENGTH_MAP = new HashMap<>();

    static {
        PHONE_LENGTH_MAP.put("IN", Map.of("min", 10, "max", 10, "fixed", true));
        PHONE_LENGTH_MAP.put("US", Map.of("min", 10, "max", 10, "fixed", true));
        PHONE_LENGTH_MAP.put("CA", Map.of("min", 10, "max", 10, "fixed", true));
        PHONE_LENGTH_MAP.put("AE", Map.of("min", 9, "max", 9, "fixed", true));
        PHONE_LENGTH_MAP.put("SA", Map.of("min", 9, "max", 9, "fixed", true));
        PHONE_LENGTH_MAP.put("QA", Map.of("min", 8, "max", 8, "fixed", true));
        PHONE_LENGTH_MAP.put("KW", Map.of("min", 8, "max", 8, "fixed", true));
        PHONE_LENGTH_MAP.put("BH", Map.of("min", 8, "max", 8, "fixed", true));
        PHONE_LENGTH_MAP.put("OM", Map.of("min", 8, "max", 8, "fixed", true));

        PHONE_LENGTH_MAP.put("SG", Map.of("min", 8, "max", 8, "fixed", true));
        PHONE_LENGTH_MAP.put("MY", Map.of("min", 9, "max", 10, "fixed", false));
        PHONE_LENGTH_MAP.put("LK", Map.of("min", 9, "max", 9, "fixed", true));
        PHONE_LENGTH_MAP.put("TH", Map.of("min", 9, "max", 9, "fixed", true));
        PHONE_LENGTH_MAP.put("ID", Map.of("min", 10, "max", 12, "fixed", false));
        PHONE_LENGTH_MAP.put("PH", Map.of("min", 10, "max", 10, "fixed", true));
        PHONE_LENGTH_MAP.put("CN", Map.of("min", 11, "max", 11, "fixed", true));
        PHONE_LENGTH_MAP.put("JP", Map.of("min", 10, "max", 10, "fixed", true));
        PHONE_LENGTH_MAP.put("KR", Map.of("min", 10, "max", 11, "fixed", false));

        PHONE_LENGTH_MAP.put("GB", Map.of("min", 10, "max", 11, "fixed", false));
        PHONE_LENGTH_MAP.put("DE", Map.of("min", 10, "max", 11, "fixed", false));
        PHONE_LENGTH_MAP.put("FR", Map.of("min", 9, "max", 9, "fixed", true));
        PHONE_LENGTH_MAP.put("ES", Map.of("min", 9, "max", 9, "fixed", true));
        PHONE_LENGTH_MAP.put("IT", Map.of("min", 9, "max", 10, "fixed", false));
        PHONE_LENGTH_MAP.put("NL", Map.of("min", 9, "max", 9, "fixed", true));

        PHONE_LENGTH_MAP.put("BR", Map.of("min", 10, "max", 11, "fixed", false));
        PHONE_LENGTH_MAP.put("AR", Map.of("min", 10, "max", 10, "fixed", true));
        PHONE_LENGTH_MAP.put("MX", Map.of("min", 10, "max", 10, "fixed", true));
        PHONE_LENGTH_MAP.put("CO", Map.of("min", 10, "max", 10, "fixed", true));
        PHONE_LENGTH_MAP.put("DM", Map.of("min", 10, "max", 10, "fixed", true));

        PHONE_LENGTH_MAP.put("ZA", Map.of("min", 9, "max", 9, "fixed", true));
        PHONE_LENGTH_MAP.put("NG", Map.of("min", 10, "max", 10, "fixed", true));
        PHONE_LENGTH_MAP.put("KE", Map.of("min", 9, "max", 9, "fixed", true));
        PHONE_LENGTH_MAP.put("EG", Map.of("min", 10, "max", 10, "fixed", true));

        PHONE_LENGTH_MAP.put("AU", Map.of("min", 9, "max", 9, "fixed", true));
        PHONE_LENGTH_MAP.put("NZ", Map.of("min", 8, "max", 10, "fixed", false));
    }
    
    
    
    @GetMapping("/currencies")
    public List<Map<String, String>> getCurrencies() {
        try {
            String baseUrl = IpConfig.projectSchemeUrl;
            String response = getCustDataDto.apiResponseGet(baseUrl + "countrymaster/find-all");

            if (response != null && !response.isBlank()) {

                List<Map<String, Object>> crmCountries = mapper.readValue(
                        response,
                        new TypeReference<List<Map<String, Object>>>() {
                        });

                List<Map<String, String>> result = new ArrayList<>();

                for (Map<String, Object> crmCountry : crmCountries) {

                    Map<String, String> mapped = new HashMap<>();

                    String countryName = String.valueOf(
                            crmCountry.getOrDefault("countryname", ""));

                    String countryCode = String.valueOf(
                            crmCountry.getOrDefault("countrycode", ""));

                    String dialCode = String.valueOf(
                            crmCountry.getOrDefault("dialcode", ""));

                    Map<String, String> currencyInfo = CURRENCY_MAP.getOrDefault(
                            countryCode.toUpperCase(),
                            Map.of("code", "USD", "symbol", "$"));

                    Map<String, Object> phoneRule = PHONE_LENGTH_MAP.getOrDefault(
                            countryCode.toUpperCase(),
                            Map.of(
                                    "min", 5,
                                    "max", 15,
                                    "fixed", false));

                    mapped.put("code", currencyInfo.get("code"));
                    mapped.put("name", countryName);
                    mapped.put("symbol", currencyInfo.get("symbol"));
                    mapped.put("country", countryCode);
                    mapped.put("dialCode", dialCode);

                    mapped.put("phoneMinLength",
                            String.valueOf(phoneRule.get("min")));

                    mapped.put("phoneMaxLength",
                            String.valueOf(phoneRule.get("max")));

                    mapped.put("phoneFixedLength",
                            String.valueOf(phoneRule.get("fixed")));

                    result.add(mapped);
                }

                if (!result.isEmpty()) {
                    return result;
                }
            }
        } catch (Exception e) {
            logger.error("Failed to fetch metadata countries list: {}", e.getMessage(), e);
        } 

        return List.of(
                Map.of(
                        "code", "INR",
                        "name", "India",
                        "symbol", "₹",
                        "country", "IN",
                        "dialCode", "+91",
                        "phoneMinLength", "10",
                        "phoneMaxLength", "10",
                        "phoneFixedLength", "true"));
    }

    @GetMapping("/default")
    public Map<String, String> getDefaultCountry() {

        try {
            String baseUrl = IpConfig.projectSchemeUrl;

            String response = getCustDataDto.apiResponseGet(
                    baseUrl + "countrymaster/find-by-defaultflag?defaultflag=true");

            if (response != null && !response.isBlank()) {

                List<Map<String, Object>> countries = mapper.readValue(
                        response,
                        new TypeReference<List<Map<String, Object>>>() {
                        });

                if (!countries.isEmpty()) {

                    Map<String, Object> crmCountry = countries.get(0);

                    Map<String, String> mapped = new HashMap<>();

                    String countryCode = String.valueOf(
                            crmCountry.getOrDefault("countrycode", "IN"));

                    String dialCode = String.valueOf(
                            crmCountry.getOrDefault("dialcode", "+91"));

                    Map<String, String> currencyInfo = CURRENCY_MAP.getOrDefault(
                            countryCode.toUpperCase(),
                            Map.of("code", "INR", "symbol", "₹"));

                    Map<String, Object> phoneRule = PHONE_LENGTH_MAP.getOrDefault(
                            countryCode.toUpperCase(),
                            Map.of(
                                    "min", 5,
                                    "max", 15,
                                    "fixed", false));

                    mapped.put("code", currencyInfo.get("code"));
                    mapped.put("name", String.valueOf(
                            crmCountry.getOrDefault("countryname", "India")));

                    mapped.put("symbol", currencyInfo.get("symbol"));
                    mapped.put("country", countryCode);
                    mapped.put("dialCode", dialCode);

                    mapped.put("phoneMinLength",
                            String.valueOf(phoneRule.get("min")));

                    mapped.put("phoneMaxLength",
                            String.valueOf(phoneRule.get("max")));

                    mapped.put("phoneFixedLength",
                            String.valueOf(phoneRule.get("fixed")));

                    return mapped;
                }
            }

        } catch (Exception e) {
            logger.error("Failed to fetch default country metadata: {}", e.getMessage(), e);
        }

        return Map.of(
                "code", "INR",
                "name", "India",
                "symbol", "₹",
                "country", "IN",
                "dialCode", "+91",
                "phoneMinLength", "10",
                "phoneMaxLength", "10",
                "phoneFixedLength", "true");
    }
}
