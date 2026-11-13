package com.blogtec.aurixwebapi.asp.lib;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.dto.ClientAccessLogDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;

/**
 * ✅ AspLoginDetailsController
 * Controller for logging frontend/client system access audit details into systemdetails table.
 */
@RestController
@RequestMapping("/systemdetails")
@Tag(name = "System Details Audit Controller API", description = "Endpoints for logging frontend and device access audit details.")
public class AspLoginDetailsController {

    private final AspLoginDetails aspLoginDetails;

    @Autowired
    public AspLoginDetailsController(AspLoginDetails aspLoginDetails) {
        this.aspLoginDetails = aspLoginDetails;
    }

    @PostMapping("/log")
    @Operation(summary = "Log Client System Access", description = "Logs client device access, userid, frame name, operation, description, and shopcode into systemdetails table.")
    public ResponseEntity<?> logClientAccess(
            HttpServletRequest request,
            @RequestBody ClientAccessLogDto dto) {

        String macId = dto.getMacId();
        if (macId != null && !macId.trim().isEmpty()) {
            aspLoginDetails.getClientAccess(
                dto.getUserid(),
                dto.getFramename(),
                dto.getOperation(),
                dto.getDescription(),
                dto.getShopcode(),
                macId
            );
        } else {
            aspLoginDetails.getClientAccess(
                request,
                dto.getUserid(),
                dto.getFramename(),
                dto.getOperation(),
                dto.getDescription(),
                dto.getShopcode()
            );
        }

        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "System access log recorded successfully"
        ));
    }
}
