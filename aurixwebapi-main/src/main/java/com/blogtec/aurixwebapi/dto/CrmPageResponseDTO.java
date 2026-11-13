package com.blogtec.aurixwebapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Paginated CRM Customer Response")
public class CrmPageResponseDTO {

    @Schema(description = "List of customer records on the current page")
    private List<CrmDTO> content;

    @Schema(description = "Current page number (1-based)", example = "1")
    private int page;

    @Schema(description = "Page size (items per page)", example = "20")
    private int size;

    @Schema(description = "Total number of customer records matching the filter", example = "196437")
    private long totalElements;

    @Schema(description = "Total number of pages", example = "9822")
    private int totalPages;
}

