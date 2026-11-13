package com.blogtec.aurixwebapi.Barcode;

import java.util.List;
import java.util.Map;

public interface BarcodeDetailsService {
    Map<String, List<?>> getAllBarcodeDetails(String barcode);
    byte[] getImageBarcode(String barcodeno);
}
