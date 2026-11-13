package com.blogtec.aurixwebapi.discountdetails;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.dto.DiscountDetailsDto;

import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;

/**
 * Jasper report service implementation for DiscountDetails.
 * Produces PDF bytes for a given list of DiscountDetails entities.
 */
@Service
public class DiscountDetailsJasperReportServiceImp implements DiscountDetailsJasperReportService {

    private static final Logger log = LoggerFactory.getLogger(DiscountDetailsJasperReportServiceImp.class);

    private static final String REPORT_PATH = "reports/DiscountDetailsReport.jrxml";

    @Override
    public byte[] generatePdfReport(List<DiscountDetails> discountList) {
        if (discountList == null) {
            log.warn("generatePdfReport called with null discountList; returning empty PDF.");
            return new byte[0];
        }

        try (InputStream jrxmlInput = new ClassPathResource(REPORT_PATH).getInputStream()) {

            // compile report
            JasperReport jasperReport = JasperCompileManager.compileReport(jrxmlInput);

            // create DTOs if needed (assuming you have a DiscountDetailsDto with a constructor that accepts DiscountDetails)
            List<DiscountDetailsDto> dtoList = discountList.stream()
                    .map(DiscountDetailsDto::new)
                    .collect(Collectors.toList());

            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(dtoList);

            Map<String, Object> parameters = new HashMap<>();
            String shopCode = "";
            if (!discountList.isEmpty()) {
                // adjust getter name to match your entity (getShopCode() or getShopcode())
                try {
                    shopCode = discountList.get(0).getShopCode(); // keep this if your entity has getShopCode()
                } catch (NoSuchMethodError | AbstractMethodError | RuntimeException ex) {
                    // fallback: try alternative method name
                    try {
                        shopCode = discountList.get(0).getShopCode();
                    } catch (RuntimeException ex2) {
                        // give up and leave shopCode empty
                        shopCode = "";
                    }
                }
            }
            parameters.put("Heading", ("Discount Details Report - / " + shopCode).toUpperCase());

            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

            // export to PDF
            return JasperExportManager.exportReportToPdf(jasperPrint);

        } catch (IOException | JRException e) {
            log.error("Error generating Jasper PDF report", e);
            // return empty array instead of null to avoid NPEs upstream
            return new byte[0];
        }
    }
}

