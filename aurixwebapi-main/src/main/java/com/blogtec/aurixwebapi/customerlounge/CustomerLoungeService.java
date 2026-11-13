package com.blogtec.aurixwebapi.customerlounge;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.dto.BarcodeDetailDTO;
import com.blogtec.aurixwebapi.dto.CategoryForCustomerDto;
import com.blogtec.aurixwebapi.dto.getDesginDTO;
import com.blogtec.aurixwebapi.dto.getSubdesginDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomerLoungeService {

    private final CustomerLoungeRepository repos;


    /* ============================================================
       1️⃣ DESIGN LIST (CATEGORY FILTER / ALL)
       ============================================================ */
    public List<getDesginDTO> getDesignList(String category) {

        List<Object[]> rows =
                "All".equalsIgnoreCase(category)
                        ? repos.getAllDesignWise()
                        : repos.getDesignWiseByCategory(category);

        return rows.stream()
                .map(r -> new getDesginDTO(
                        String.valueOf(r[0]),   // design code
                        String.valueOf(r[1]),   // category
                        String.valueOf(r[2]),   // item desc
                        String.valueOf(r[3])    // design name
                ))
                .collect(Collectors.toList());
    }



    /* ============================================================
       2️⃣ SUB DESIGN LIST
       ============================================================ */
    public List<getSubdesginDTO> getSubDesignList(Integer designcode) {

        List<Object[]> rows = repos.getSubDesignByDesign(designcode);

        return rows.stream()
                .map(r -> new getSubdesginDTO(
                        String.valueOf(r[0]),        // designcode
                        (Integer) r[1],              // sub design code
                        String.valueOf(r[2]),        // category
                        String.valueOf(r[3]),        // item desc
                        String.valueOf(r[4])         // sub design name
                ))
                .collect(Collectors.toList());
    }
    
    




    /* ============================================================
       3️⃣ BARCODE LIST
       ============================================================ */
    public List<Map<String, Object>> getBarcodeList(String subdesign) {

        List<Object[]> rows = repos.getBarcodeBySubDesign(subdesign);

        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] r : rows) {
            Map<String, Object> map = new HashMap<>();
            map.put("dsgnname", r[0]);
            map.put("barcode", r[1]);
            result.add(map);
        }

        return result;
    }


    /* ============================================================
       4️⃣ CATEGORY LIST
       ============================================================ */
    public List<CategoryForCustomerDto> getCategoryForCustomer(String shopcode) {

        return repos.getCategoryForCustomer(shopcode)
                .stream()
                .map(CategoryForCustomerDto::new)
                .collect(Collectors.toList());
    }



    /* ============================================================
       5️⃣ BARCODE FULL DETAILS
       ============================================================ */
    public List<BarcodeDetailDTO> getDetailedReportForCustomer(
            String dsgnname,
            String shopcode
    ) {

        List<BarcodeDetailDTO> rows =
                repos.getDetailedBarcodeReport(dsgnname, shopcode);

        return rows == null ? List.of() : rows;
    }



    /* ============================================================
       6️⃣ COMPANY IMAGE
       ============================================================ */
    public byte[] getCompanyImage() {
        return repos.getCompanyImage();
    }

}