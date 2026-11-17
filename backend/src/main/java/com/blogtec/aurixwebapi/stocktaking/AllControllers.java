package com.blogtec.aurixwebapi.stocktaking;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.blogtec.aurixwebapi.stocktaking.*;

@RestController
@RequestMapping("/api/v1")
public class AllControllers {
	
	private final CounterService counterService;
	private final ItemService itemService;
	private final SalesmanService salesmanService;
	private final ShopService shopService;
	private final StockTakingService stockTakingService;
	
	public AllControllers(
			CounterService counterService,
			ItemService itemService,
			SalesmanService salesmanService,
			ShopService shopService,
			StockTakingService stockTakingService
			) {
		this.counterService = counterService;
		this.itemService = itemService;
		this.salesmanService = salesmanService;
		this.shopService = shopService;
		this.stockTakingService = stockTakingService;
	}
	
	@GetMapping("/health")
	public String health() {
	    return "OK";
	}
	
	@GetMapping("/counters")
	public List<CounterDto> getAllcounters(){
		return counterService.getAllCounters();
	}
	
	@GetMapping("/item-by-counter")
	public List<ItemDto> getItemByCounter(
			@RequestParam String counterCode) {
		return itemService.getItemsByCounter(counterCode);
	}
	
	@GetMapping("/salesman")
	public List<SalesmanDto> getAllSalesmen(){
		return salesmanService.getAllSalesmens();
	}
	
	@GetMapping("/allshop")
	public List<ShopDto> getAllShop(){
		return shopService.getAllShops();
	}
	
	@GetMapping("/shop")
	public ShopDto getShopByCode(
	        @RequestParam String shopCode) {

	    return shopService.getShopByCode(shopCode);
	}
	

	@GetMapping("/stock-taking/next-slno")
	public Long getNextStockSerial() {
	    return stockTakingService.getNextStockSerial();
	}
	
	@PostMapping("/stock-taking")
	public void insertstockTaking(
	        @RequestBody StockTakingDto stockTaking) {

	    stockTakingService.insertStockTaking(stockTaking);
	}
	
	@DeleteMapping("/stock-taking/{slno}")
	public void deleteStockTaking(
	        @PathVariable String slno) {

	    stockTakingService.deleteStockTaking(slno);
	}
	
	@PostMapping("/stock-taking/transactions")
	public StockTakingTransactionResponse addStockTakingTransaction(
	        @RequestBody StockTakingTransactionRequest request) {

	    return stockTakingService.addStockTakingTransaction(
	            request.getSlno(),
	            request.getBarcode(),
	            request.getMacId(),
	            request.getIp()
	    );
	}
	
	@DeleteMapping("/stock-taking/transactions/{barcode}")
	public void deleteStockTakingTransaction(
	        @PathVariable String barcode) {

	    stockTakingService.deleteStockTakingTransaction(
	            barcode
	    );
	}
}