package com.blogtec.aurixwebapi.setdiscount;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/setdiscount")
public class SetDiscountController {

    private final SetDiscountService service;

    public SetDiscountController(SetDiscountService service) {
        this.service = service;
    }

   

    @GetMapping("/list")
    public ResponseEntity<?> list() {

    

        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/timeout")
    public ResponseEntity<?> getIdleTimeoutMinutes(
            ) {

        return ResponseEntity.ok(service.fetchIdleTimeoutMinutes());
    }
}
