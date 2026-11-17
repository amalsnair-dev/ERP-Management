package com.blogtec.aurixwebapi.setdiscount;

import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.dto.SetDiscountDTO;

import java.util.List;

@Service
public class SetDiscountService {

    private final SetDiscountRepository repo;

    public SetDiscountService(SetDiscountRepository repo) {
        this.repo = repo;
    }

    public List<SetDiscountDTO> getAll() {
        return repo.getAllData();
    }

    public Integer fetchIdleTimeoutMinutes() {
        return repo.getIdleTimeout();
    }
}
