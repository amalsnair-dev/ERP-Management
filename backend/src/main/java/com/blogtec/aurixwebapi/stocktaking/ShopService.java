package com.blogtec.aurixwebapi.stocktaking;

import java.util.List;

import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.stocktaking.*;


@Service
public class ShopService {
	
	private final ShopRepository shopRepository;
	
	public ShopService(ShopRepository shopRepository) {
		
		this.shopRepository = shopRepository;
	}
	
	public List<ShopDto> getAllShops(){
		return shopRepository.findAllShops();
	}
	
	public ShopDto getShopByCode(String shopCode) {
	    return shopRepository.findShopByCode(shopCode);
	}
	
	public boolean isShopNetworkReachable(String shopCode) {

	    ShopDto shop = shopRepository.findShopByCode(shopCode);

	    if (shop == null || shop.getIpNumber() == null) {
	        return false;
	    }

	    try (java.net.Socket socket = new java.net.Socket()) {

	        socket.connect(
	                new java.net.InetSocketAddress(
	                        shop.getIpNumber(),
	                        5432
	                ),
	                2000
	        );

	        return true;

	    } catch (Exception e) {
	        return false;
	    }
	}

}
