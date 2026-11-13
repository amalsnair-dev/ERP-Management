package com.blogtec.aurixwebapi.easytotal;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.blogtec.aurixwebapi.dto.EasyTotalDto;
import com.blogtec.aurixwebapi.sales.saleestRepository;

@Service
public class EasyTotalServiceImp implements EasyTotalService {


    @Autowired
    private saleestRepository saleest;


    // Enum for metal types
    private enum MetalType {
        GOLD("G", "Gold"),
        PLATINUM("P", "Platinum"),
        SILVER("S", "Silver");

        private final String code;
        private final String label;

        MetalType(String code, String label) {
            this.code = code;
            this.label = label;
        }
    }

    // Enum for operation types
    private enum OperationType {
        SALE("Sale"),
        PURCHASE("Purchase"),
        CREDITNOTE("Credit Note");

        private final String label;

        OperationType(String label) {
            this.label = label;
        }
    }



    @Override
    public List<EasyTotalDto> getEasyTotal() {
        List<EasyTotalDto> resultList = new ArrayList<>();
        int slNo = 1;

        for (MetalType metal : MetalType.values()) {
            for (OperationType op : OperationType.values()) {
                List<Object[]> queryResult = fetchDataFor(metal, op);
                for (Object[] row : queryResult) {
                    BigDecimal weight = (BigDecimal) row[0];
                    BigDecimal amount = (BigDecimal) row[1];
                    resultList.add(new EasyTotalDto(slNo++, metal.label, op.label, weight, amount));
                }
            }
        }

  

        return resultList;
    }

   

    private List<Object[]> fetchDataFor(MetalType metal, OperationType op) {
        switch (op) {
            case SALE:
                return saleest.getsalewtforeasytotal(metal.code);
            case PURCHASE:
                return saleest.getpurchasewtforeasytotal(metal.code);
            case CREDITNOTE:
                return saleest.getcreditnotewtforeasytotal(metal.code);
            default:
                return new ArrayList<>();
        }
    }
}
