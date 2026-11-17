package com.blogtec.aurixwebapi.smassign;

import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.dto.SmAssignDto;

import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;

@Service
public class SmAssignJasperReportService {

    public byte[] generateSmAssignReport(List<SmAssign> dataList) throws Exception {
        InputStream jrxmlInput = new ClassPathResource("reports/DailyVisitingCustomer.jrxml").getInputStream();

        JasperReport jasperReport = JasperCompileManager.compileReport(jrxmlInput);

        List<SmAssignDto> dtoList = dataList.stream()
            .map(SmAssignDto::new)
            .collect(Collectors.toList());

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(dtoList);

        Map<String, Object> parameters = new HashMap<>();
        String shopCode = dataList.isEmpty() ? "" : dataList.get(0).getShopcode();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String formattedDate = dataList.isEmpty() ? "" : dataList.get(0).getDate().format(formatter);
        parameters.put("Heading", ("Daily Visiting Customer Report - "+formattedDate+" / "+shopCode).toUpperCase());

        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

        return JasperExportManager.exportReportToPdf(jasperPrint);
    }
}


