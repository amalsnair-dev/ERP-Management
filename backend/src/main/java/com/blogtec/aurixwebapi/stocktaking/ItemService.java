package com.blogtec.aurixwebapi.stocktaking;

import java.util.List;

import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.stocktaking.*;

@Service
public class ItemService {
	
	private final ItemRepository itemRepository;
	
	public ItemService(ItemRepository itemRepository) {
		this.itemRepository = itemRepository;
	}
	
	public List<ItemDto> getItemsByCounter(String counterCode){
		
		return itemRepository.findItemsByCounter(counterCode);
	}

}
