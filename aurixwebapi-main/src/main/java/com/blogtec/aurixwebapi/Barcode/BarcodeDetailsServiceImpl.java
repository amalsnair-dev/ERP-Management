package com.blogtec.aurixwebapi.Barcode;

import static java.math.BigDecimal.ROUND_HALF_UP;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.dto.BarcodeDetailsDTO;

import jakarta.persistence.Tuple;

@Service
public class BarcodeDetailsServiceImpl implements BarcodeDetailsService {

    private final BarcodeDetailsRepository barcodeDetailsRepository;

    @Autowired
    public BarcodeDetailsServiceImpl(BarcodeDetailsRepository barcodeDetailsRepository) {
        this.barcodeDetailsRepository = barcodeDetailsRepository;
    }

    @Override
    public Map<String, List<?>> getAllBarcodeDetails(String barcode) {

        List<Tuple> resultList = barcodeDetailsRepository.getAllBarcodeDetails(barcode);

        Map<String, List<?>> result = new HashMap<>();

        if (resultList == null || resultList.isEmpty()) {
            result.put("ItemDetails", Collections.emptyList());
            result.put("StoneDetails", Collections.emptyList());
            return result;
        }

        List<Tuple> resultList1 = barcodeDetailsRepository.getAllBarcodeClass(barcode);

        result.put("ItemDetails", mapToBarcodeDetails(resultList));
        result.put("StoneDetails", mapToBarcodeClass(resultList1));

        return result;
    }

    // ✅ SAFE METHODS
    private BigDecimal getBigDecimal(Tuple t, String key) {
        Object val = t.get(key);
        return val != null ? new BigDecimal(val.toString()) : BigDecimal.ZERO;
    }

    private String getString(Tuple t, String key) {
        Object val = t.get(key);
        return val != null ? val.toString() : "";
    }

    @SuppressWarnings("deprecation")
    private List<BarcodeDetailsDTO> mapToBarcodeDetails(List<Tuple> tuples) {

        List<BarcodeDetailsDTO> list = new ArrayList<>();
        SimpleDateFormat dateFormat = new SimpleDateFormat("dd-MM-yyyy");

        for (Tuple t : tuples) {

            BarcodeDetailsDTO dto = new BarcodeDetailsDTO();

            BigDecimal rate = getBigDecimal(t, "rate");
            BigDecimal netWeight = getBigDecimal(t, "netweight");
            BigDecimal valueAddition = getBigDecimal(t, "valueaddition");
            BigDecimal stoneCharge = getBigDecimal(t, "stonecharge");
            BigDecimal tax = getBigDecimal(t, "tax");

            // ✅ Calculations
            BigDecimal goldAmount = netWeight.multiply(rate).setScale(2, ROUND_HALF_UP);

            BigDecimal vaAmount = goldAmount
                    .multiply(valueAddition)
                    .divide(BigDecimal.valueOf(100), 2, ROUND_HALF_UP);

            BigDecimal totalAmount = stoneCharge.add(goldAmount).add(vaAmount);

            BigDecimal gstAmount = totalAmount
                    .multiply(tax)
                    .divide(BigDecimal.valueOf(100), 2, ROUND_HALF_UP);

            // ✅ Date
            java.sql.Date sqlDate = t.get("today", java.sql.Date.class);
            String formattedDate = (sqlDate != null) ? dateFormat.format(sqlDate) : "";

            // ✅ Set values
            dto.setBarcode(getString(t, "barcode"));
            dto.setDate(formattedDate);
            dto.setPartyName(getString(t, "partyname"));
            dto.setDesignName(getString(t, "designdescription"));
            dto.setItemCode(getString(t, "itemcode"));
            dto.setItemName(getString(t, "itemname"));
            dto.setPurity(getString(t, "purity"));
            dto.setItemCounter(getString(t, "itemcounter"));

            dto.setQuantity(getBigDecimal(t, "num"));
            dto.setGrossWeight(getBigDecimal(t, "grossweight"));
            dto.setActualWeight(getBigDecimal(t, "grossweight"));
            dto.setStoneWeight(getBigDecimal(t, "stoneweight"));
            dto.setNetWeight(netWeight);

            dto.setDesignCode(getString(t, "designcode"));
            dto.setDcode(getString(t, "dcode")); // ✅ FIXED

            String billType = getString(t, "billtype");

            if (!"P".equalsIgnoreCase(billType)) {

                dto.setRate(rate);
                dto.setMetalAmount(goldAmount);
                dto.setVaPercent(valueAddition);
                dto.setVaAmount(vaAmount);
                dto.setStoneCharge(stoneCharge);
                dto.setTaxableAmount(totalAmount);
                dto.setGstPercent(tax);
                dto.setGstAmount(gstAmount);
                dto.setNetAmount(totalAmount.add(gstAmount));

            } else {

                BigDecimal pieceRate = getBigDecimal(t, "piecerate");

                BigDecimal gst = pieceRate
                        .multiply(tax)
                        .divide(tax.add(BigDecimal.valueOf(100)), 2, ROUND_HALF_UP);

                BigDecimal taxable = pieceRate.subtract(gst);

                dto.setTaxableAmount(taxable);
                dto.setGstPercent(tax);
                dto.setGstAmount(gst);
                dto.setNetAmount(pieceRate);
            }

            list.add(dto);
        }

        return list;
    }

    @SuppressWarnings("deprecation")
    private List<BarcodeClassDTO> mapToBarcodeClass(List<Tuple> tuples) {

        List<BarcodeClassDTO> list = new ArrayList<>();
        int i = 1;

        for (Tuple t : tuples) {

            BarcodeClassDTO dto = new BarcodeClassDTO();
            dto.setSlno(i++);
            dto.setStonecode(getString(t, "stonecode"));
            dto.setStonename(getString(t, "stonename"));
            dto.setStonerate(getBigDecimal(t, "stonerate"));
            dto.setStno(t.get("stno", Integer.class));
            dto.setStonevalue(getBigDecimal(t, "stonevalue"));
            dto.setGrmwt(getBigDecimal(t, "grmwt"));
            dto.setCrwt(getBigDecimal(t, "crwt").setScale(3, ROUND_HALF_UP));

            list.add(dto);
        }

        return list;
    }

    @Override
    public byte[] getImageBarcode(String barcodeno) {
        return barcodeDetailsRepository.getAllBarcodeimage(barcodeno);
    }
}