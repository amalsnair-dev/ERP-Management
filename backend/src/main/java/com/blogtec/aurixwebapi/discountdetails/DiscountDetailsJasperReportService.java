package com.blogtec.aurixwebapi.discountdetails;


import java.io.IOException;
import java.util.List;

public interface DiscountDetailsJasperReportService
{
    /**
     * Generate a Jasper report PDF as byte[] wrapped in ResponseEntity.
     * Implementation may accept parameters as needed.
     * @throws IOException 
     */

	byte[] generatePdfReport(List<DiscountDetails> discountList) throws IOException;
}