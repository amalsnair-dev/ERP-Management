package com.blogtec.aurixwebapi.stocktaking;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class StockTakingExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleIllegalArgumentException(
            IllegalArgumentException exception) {

        String code = exception.getMessage();

        String message = switch (code) {

            case "INVALID_MASTER_ENTRY" ->
                    "Stock entry is invalid. Please select a valid stock entry.";

            case "INVALID_BARCODE" ->
                    "Barcode is invalid. Please check the barcode and try again.";

            case "ITEM_SOLD" ->
                    "This item has already been sold and cannot be added.";

            case "CATEGORY_MISMATCH" ->
                    "This item does not belong to the selected stock category.";

            case "ALREADY_ENTERED" ->
                    "This barcode has already been entered for this stock entry.";

            default ->
                    "Unable to process the stock transaction.";
        };

        return Map.of(
                "code", code,
                "message", message
        );
    }
}