package com.blogtec.aurixwebapi.sync.builders;

import com.blogtec.aurixwebapi.config.IpConfig;
import com.blogtec.aurixwebapi.dto.GetCustDataDto;
import com.blogtec.aurixwebapi.dto.SyncPayloadDto.SchemeSyncDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class SchemeSummaryBuilder {

    private static final Logger logger = LoggerFactory.getLogger(SchemeSummaryBuilder.class);

    private final GetCustDataDto getCustDataDto;
    private final ObjectMapper objectMapper;

    public SchemeSummaryBuilder(GetCustDataDto getCustDataDto, ObjectMapper objectMapper) {
        this.getCustDataDto = getCustDataDto;
        this.objectMapper = objectMapper;
    }

    public SchemeSyncDto buildSchemeSummary(String shopCode, String dateStr) {
        SchemeSyncDto dto = new SchemeSyncDto();
        try {
            String baseUrl = IpConfig.getProjectSchemeUrl();
            if (baseUrl == null || baseUrl.isEmpty()) {
                logger.warn("projectSchemeUrl is not configured - scheme summary will be zero");
                return dto;
            }

            String apiUrl = baseUrl + "kurytran/opening?date=" + dateStr + "&shopcode=" + shopCode;
            logger.debug("Fetching scheme summary from: {}", apiUrl);

            String response = getCustDataDto.apiResponseGet(apiUrl);
            if (response == null || response.isBlank()) {
                logger.warn("Empty response from kurytran/opening API");
                return dto;
            }

            JsonNode arr = objectMapper.readTree(response);
            if (!arr.isArray()) {
                logger.warn("kurytran/opening response is not a JSON array");
                return dto;
            }

            for (JsonNode node : arr) {
                String mode = node.path("mode").asText("");
                BigDecimal amount = BigDecimal.valueOf(node.path("amount").asDouble(0));
                BigDecimal grwt = BigDecimal.valueOf(node.path("grwt").asDouble(0));
                int nos = node.path("nos").asInt(0);
                switch (mode) {
                    case "OP" -> { 
                        dto.openingSchemeAmount = dto.openingSchemeAmount.add(amount);
                        dto.openingSchemeWeight = dto.openingSchemeWeight.add(grwt);
                        dto.openingSchemeCount += nos;
                    }
                    case "TO" -> { 
                        dto.newSchemeAmount = dto.newSchemeAmount.add(amount);
                        dto.newSchemeWeight = dto.newSchemeWeight.add(grwt);
                        dto.newSchemeCount += nos;
                    }
                    case "TC" -> { 
                        dto.collectionSchemeAmount = dto.collectionSchemeAmount.add(amount);
                        dto.collectionSchemeWeight = dto.collectionSchemeWeight.add(grwt);
                    }
                    case "TS" -> { 
                        dto.closedSchemeAmount = dto.closedSchemeAmount.add(amount);
                        dto.closedSchemeWeight = dto.closedSchemeWeight.add(grwt);
                        dto.closedSchemeCount += nos;
                    }
                    default -> logger.debug("Unknown kurytran mode: {}", mode);
                }
            }

            dto.balanceSchemeAmount = dto.openingSchemeAmount.add(dto.collectionSchemeAmount)
                    .subtract(dto.closedSchemeAmount);
            dto.balanceSchemeWeight = dto.openingSchemeWeight.add(dto.collectionSchemeWeight)
                    .subtract(dto.closedSchemeWeight);
            dto.activeSchemeCount = dto.openingSchemeCount + dto.newSchemeCount - dto.closedSchemeCount;

        } catch (Exception e) {
            logger.error("Error fetching scheme summary from API: {}", e.getMessage());
        }
        return dto;
    }
}
