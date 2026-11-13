package com.blogtec.aurixwebapi.sales;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blogtec.aurixwebapi.dto.*;
import com.blogtec.aurixwebapi.payload.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Date;

@Service
public class SalesEntryService {

	@Autowired
	private JdbcTemplate jdbcTemplate;
	private static final Logger log = LoggerFactory.getLogger(SalesEntryService.class);

	private String d(String s) {
		return s != null ? s : "";
	}

	private java.math.BigDecimal d(java.math.BigDecimal b) {
		return b != null ? b : java.math.BigDecimal.ZERO;
	}

	private Integer d(Integer i) {
		return i != null ? i : 0;
	}

	private Boolean d(Boolean b) {
		return b != null ? b : false;
	}

	private java.sql.Date d(java.sql.Date d) {
		return d != null ? d : new java.sql.Date(System.currentTimeMillis());
	}

	@SuppressWarnings("null")
	@Transactional
	public void saveGeneralDetails(SalesGeneralPayload p) {
		log.info("📝 [saveGeneralDetails] EstNo: {}", p.getEstNo());
		// 1. Delete header first
		jdbcTemplate.update("DELETE FROM estmstr WHERE est_no = ?", p.getEstNo());

		// 2. Insert header
		Date estDate = parseDate(p.getEstDte());
		Date estsDate = parseDate(p.getEstsdate());


String sql = "INSERT INTO estmstr ("

    + "est_no, est_dte, est_grate, userid, custid, est_cunm, est_add1, est_add2, est_add3, "

    + "est_pin, est_phone, est_sman1, est_sman2, est_optr, gold_slv, barflag, "

    + "est_gstper, est_igstper, est_othtaxper, est_tamt, est_discount, prev_amt, "

    + "panno, gstno, estsbillno, estsdate, estyear, est_disrate, shopcode, careof, aadhaar, "

    + "grate22, grate18, slvrate, totadvcash"

    + ") VALUES ("

    + ":est_no, :est_dte, :est_grate, :userid, :custid, :est_cunm, :est_add1, :est_add2, :est_add3, "

    + ":est_pin, :est_phone, :est_sman1, :est_sman2, :est_optr, :gold_slv, :barflag, "

    + ":est_gstper, :est_igstper, :est_othtaxper, :est_tamt, :est_discount, :prev_amt, "

    + ":panno, :gstno, :estsbillno, :estsdate, :estyear, :est_disrate, :shopcode, :careof, :aadhaar, "

    + ":grate22, :grate18, :slvrate, :totadvcash"

    + ")";


		java.util.Map<String, Object> params = new java.util.HashMap<>();
		params.put("est_no", d(p.getEstNo()));
		params.put("est_dte", d(estDate));
		params.put("est_grate", d(p.getEstGrate()));
		params.put("userid", d(p.getUserid()));
		params.put("custid", d(p.getCustid()));
		params.put("est_cunm", d(p.getEstCunm()));
		params.put("est_add1", d(p.getEstAdd1()));
		params.put("est_add2", d(p.getEstAdd2()));
		params.put("est_add3", d(p.getEstAdd3()));
		params.put("est_pin", d(p.getEstPin()));
		params.put("est_phone", d(p.getEstPhone()));
		params.put("est_sman1", d(p.getEstSman1()));
		params.put("est_sman2", d(p.getEstSman2()));
		params.put("est_optr", d(p.getEstOptr()));
		String goldSlv = p.getGoldSlv();
		if (goldSlv != null && goldSlv.length() > 0) {
			goldSlv = goldSlv.substring(0, 1).toUpperCase();
		} else {
			goldSlv = "G";
		}
		params.put("gold_slv", goldSlv);
		params.put("barflag", d(p.getBarflag()));
		params.put("est_gstper", d(p.getEstGstper()));
		params.put("est_igstper", d(p.getEstIgstper()));
		params.put("est_othtaxper", d(p.getEstOthtaxper()));
		params.put("est_tamt", d(p.getEstTamt()));
		params.put("est_discount", d(p.getEstDiscount()));
		params.put("prev_amt", d(p.getPrevAmt()));
		params.put("panno", d(p.getPanno()));
		params.put("gstno", d(p.getGstno()));
		params.put("estsbillno", d(p.getEstsbillno()));
		params.put("estsdate", d(estsDate));
		params.put("estyear", d(p.getEstyear()));
		params.put("est_disrate", d(p.getEstDisrate()));
		params.put("shopcode", d(p.getShopcode()));
		params.put("careof", d(p.getCareoff()));
		
		params.put("grate22", d(p.getGrate22()));
		params.put("grate18", d(p.getGrate18()));
		params.put("slvrate", d(p.getSlvrate()));
		params.put("totadvcash", d(p.getTotadvcash()));

		String aadharStr = p.getAadharno();
		java.math.BigDecimal resolvedAadhar = java.math.BigDecimal.ZERO;
		if (aadharStr != null && !aadharStr.trim().isEmpty()) {
			try {
				resolvedAadhar = new java.math.BigDecimal(aadharStr.trim());
			} catch (Exception e) {
				resolvedAadhar = java.math.BigDecimal.ZERO;
			}
		}
		params.put("aadhaar", resolvedAadhar);

		log.debug("   -> Map: {}", params);
		new org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate(jdbcTemplate).update(sql, params);
		log.info("✅ [saveGeneralDetails] Header saved for EstNo: {}", p.getEstNo());
	}

	@Transactional
	public void saveSalesDetails(SalesItemsPayload p) {
		log.info("📝 [saveSalesDetails] EstNo: {}, Items: {}", p.getEstNo(),
				(p.getSaleItems() != null ? p.getSaleItems().size() : 0));
		if (p.getSaleItems() == null)
			return;

		// 1. Delete items first
		jdbcTemplate.update("DELETE FROM saleest WHERE est_no = ?", p.getEstNo());

		// 2. Insert items
		String sql = "INSERT INTO saleest ("
		        + "est_barcode, est_no, it_slno, est_icode, est_cntr, est_itdesc, est_qty, "
		        + "est_noded, est_wt, est_stnwt, est_wtded, est_wtadd, est_actualwt, est_ntwt, "
		        + "est_mkch, est_vaper, est_wage, est_vamt, est_stnch, est_rate, est_gamt, "
		        + "est_tamt, est_gstper, est_igstper, est_othtaxper, est_gstamt, est_igstamt, "
		        + "est_othtaxamt, totalamount, barflag, est_sman, est_sman1, afterva, aftervaamt, "
		        + "afterstnch, huid, billtime"
		        + ") VALUES ("
		        + "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "
		        + "'', clock_timestamp()::time"
		        + ")";

		for (SetSaleEstDto item : p.getSaleItems()) {
			log.debug("   -> Inserting Item SlNo: {}, ICode: {}", item.getItSlno(), item.getEstIcode());
			jdbcTemplate.update(sql, d(item.getEstBarcode()), d(p.getEstNo()), d(item.getItSlno()),
					d(item.getEstIcode()),
					d(item.getEstCntr()), d(item.getEstItdesc()), d(item.getEstQty()), d(item.getEstNoded()),
					d(item.getEstWt()),
					d(item.getEstStnwt()), d(item.getEstWtded()), d(item.getEstWtadd()), d(item.getEstActualwt()),
					d(item.getEstNtwt()), d(item.getEstMkch()), d(item.getEstVaper()), d(item.getEstWage()),
					d(item.getEstVamt()),
					d(item.getEstStnch()), d(item.getEstRate()), d(item.getEstGamt()), d(item.getEstTamt()),
					d(item.getEstGstper()),
					d(item.getEstIgstper()), d(item.getEstOthtaxper()), d(item.getEstGstamt()), d(item.getEstIgstamt()),
					d(item.getEstOthtaxamt()), d(item.getTotalamount()), d(p.getBarflag()), d(p.getSMan()),
					d(item.getEstSman1()),
					d(item.getAfterva()), d(item.getAftervaamt()), d(item.getAfterstnch()));
		}
		log.info("✅ [saveSalesDetails] Items saved for EstNo: {}", p.getEstNo());
	}
	
	@Transactional
	public Integer createSalesEntry(CreateSalesEntryPayload payload) {

	    jdbcTemplate.query(
	        "SELECT pg_advisory_xact_lock(?)",
	        rs -> {
	        },
	        987654321L
	    );

	    Integer estNo = jdbcTemplate.queryForObject(
	        "SELECT COALESCE(MAX(est_no), 0) + 1 FROM estmstr",
	        Integer.class
	    );

	    if (estNo == null || estNo <= 0) {
	        throw new IllegalStateException("Unable to generate estimate number");
	    }

	    payload.getGeneral().setEstNo(estNo);
	    payload.getSales().setEstNo(estNo);

	    saveGeneralDetails(payload.getGeneral());

	    saveSalesDetails(payload.getSales());

	    if (payload.getStones() != null
	            && payload.getStones().getStoneEntries() != null
	            && !payload.getStones().getStoneEntries().isEmpty()) {

	        payload.getStones().setEstNo(estNo);

	        saveStoneDetails(payload.getStones());
	    }

	    return estNo;
	}

	@Transactional
	public void saveSmanDetails(SalesSmanPayload p) {
		// 1. Delete salesman data first
		jdbcTemplate.update("DELETE FROM salesmanbilldata WHERE estno = ?", p.getEstNo());

		// 2. Insert salesman data dynamically from the array
		if (p.getSaleamen() != null && !p.getSaleamen().isEmpty()) {
			for (SalesSmanPayload.SalesmanItem sm : p.getSaleamen()) {
				if (sm.getSmcode() != null && !sm.getSmcode().trim().isEmpty()) {
					jdbcTemplate.update("INSERT INTO salesmanbilldata(estno, slno, salesmancode, mode) VALUES (?, ?, ?, ?)",
							p.getEstNo(), sm.getSlno(), sm.getSmcode(), "S");
				}
			}
		} else {
			// Fallback for legacy calls
			if (p.getEstSman1() != null) {
				jdbcTemplate.update("INSERT INTO salesmanbilldata(estno, slno, salesmancode, mode) VALUES (?, ?, ?, ?)",
						p.getEstNo(), 1, p.getEstSman1(), "S");
			}
			if (p.getEstSman2() != null) {
				jdbcTemplate.update("INSERT INTO salesmanbilldata(estno, slno, salesmancode, mode) VALUES (?, ?, ?, ?)",
						p.getEstNo(), 2, p.getEstSman2(), "S");
			}
		}
	}

	@Transactional
	public void saveStoneDetails(SalesStonePayload p) {
		if (p.getStoneEntries() == null || p.getStoneEntries().isEmpty())
			return;

		// 1. Delete stones only for the specific items being saved (MATCHING it_slno)
		java.util.Set<Integer> processedItems = new java.util.HashSet<>();
		for (StoneEstDto s : p.getStoneEntries()) {
			if (s.getItSlno() != null && processedItems.add(s.getItSlno())) {
				jdbcTemplate.update("DELETE FROM stoneest WHERE est_no = ? AND it_slno = ?", p.getEstNo(),
						s.getItSlno());
			}
		}

		// 2. Insert stones
		String sql = "INSERT INTO stoneest ("
				+ "barcode, est_no, it_slno, stn_typ, stn_rate, stn_qty, stn_nos, s_type, "
				+ "stn_amt, aft_stnrate, aft_stnamt, slno" + ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

		for (StoneEstDto s : p.getStoneEntries()) {
			log.debug("   -> Inserting Stone SlNo: {}, Type: {}", s.getSlno(), s.getStnTyp());
			jdbcTemplate.update(sql, d(s.getBarcode()), d(p.getEstNo()), d(s.getItSlno()), d(s.getStnTyp()),
					d(s.getStnRate()),
					d(s.getStnQty()), d(s.getStnNos()), d(s.getStype()), d(s.getStnAmt()), d(s.getStnRate()),
					d(s.getStnAmt()),
					d(s.getSlno()) // Note: aft_stnrate = stn_rate as per legacy insert
			);
		}
		log.info("✅ [saveStoneDetails] Stones saved for EstNo: {}", p.getEstNo());
	}

	@Transactional
	public void updateStoneRates(Integer estNo) {
		jdbcTemplate.update("UPDATE stoneest SET aft_stnrate = stn_rate, aft_stnamt = stn_amt WHERE est_no = ?", estNo);
	}

	@Transactional
	public void saveCreditNoteDetails(SalesCrnPayload p) {
		log.info("📝 [saveCreditNoteDetails] EstNo: {}, Items: {}", p.getEstNo(),
				(p.getCreditItems() != null ? p.getCreditItems().size() : 0));
		if (p.getCreditItems() == null)
			return;

		// 1. Delete existing credit note details
		jdbcTemplate.update("DELETE FROM crnest WHERE est_no = ?", p.getEstNo());
		jdbcTemplate.update("DELETE FROM crn_stoneest WHERE est_no = ?", p.getEstNo());

		Date estDate = parseDate(p.getEstDte());

		for (int i = 0; i < p.getCreditItems().size(); i++) {
			CreditNoteItemDto item = p.getCreditItems().get(i);
			int slno = i + 1;

			log.debug("   -> Processing Credit Note Item: Bill {}, SlNo {}", item.getBillNo(), item.getItSlno());

			// 2. Insert into crnest by selecting from sbilltran (Local Logic)
			String crnSql = "INSERT INTO crnest (est_no, est_dte, est_barcode, it_slno, est_icode, est_cntr, est_itdesc, "
					+ "est_qty, est_wt, est_stnwt, est_ntwt, est_mkch, est_vaper, est_wage, est_vamt, est_stnch, "
					+ "est_rate, est_gamt, est_tamt, est_gstper, est_igstper, est_othtaxper, est_gstamt, "
					+ "est_igstamt, est_othtaxamt, totalamount, barflag, sm, sm1, billtime, actual_stnch, "
					+ "afterva, aftervaamt, huid, estsbillno, estsdate, estyear, esttrslno, estsinvoiceno, "
					+ "stonecost, purcost) "
					+ "SELECT ?, ?, est_barcode, ?, est_icode, est_cntr, est_itdesc, est_qty, est_wt, est_stnwt, "
					+ "est_ntwt, est_mkch, est_vaper, est_wage, est_vamt, est_stnch, est_rate, est_gamt, est_tamt, "
					+ "est_gstper, est_igstper, est_othtaxper, est_gstamt, est_igstamt, est_othtaxamt, totalamount, "
					+ "barflag, sm, sm1, billtime, actual_stnch, afterva, aftervaamt, huid, ?, ?, ?, ?, ?, "
					+ "stonecost, purcost FROM sbilltran WHERE bill_no = ? AND it_slno = ?";

			jdbcTemplate.update(crnSql,
					d(p.getEstNo()),
					d(estDate),
					slno,
					d(item.getBillNo()),
					parseDate(item.getBillDate()),
					d(item.getBillYear()),
					d(item.getItSlno()),
					d(item.getInvoiceNo()),
					d(item.getBillNo()),
					d(item.getItSlno()));

			// 3. Insert into crn_stoneest by selecting from sbillstone
			String stoneSql = "INSERT INTO crn_stoneest (barcode, batch, est_no, barflag, it_slno, stn_code, s_type, "
					+ "stn_rate, stn_qty, stn_wt, stn_amt) "
					+ "SELECT barcode, batch, ?, barflag, ?, stn_code, s_type, stn_rate, stn_qty, stn_wt, stn_amt "
					+ "FROM sbillstone WHERE bill_no = ? AND it_slno = ?";

			jdbcTemplate.update(stoneSql, d(p.getEstNo()), slno, d(item.getBillNo()), d(item.getItSlno()));

			// 4. Update estmstr (as per legacy code, using details from the last processed item or header)
			if (i == 0) {
				jdbcTemplate.update("UPDATE estmstr SET estsbillno = ?, estsdate = ?, estyear = ? WHERE est_no = ?",
						item.getBillNo(), parseDate(item.getBillDate()), item.getBillYear(), p.getEstNo());
			}
		}
		log.info("✅ [saveCreditNoteDetails] Credit Note items saved for EstNo: {}", p.getEstNo());
	}

	@Transactional
	public void saveAdvestDetails(SalesAdvestPayload p) {
		log.info("📝 [saveAdvestDetails] EstNo: {}, Items: {}", p.getEstNo(),
				(p.getAdvanceItems() != null ? p.getAdvanceItems().size() : 0));
		if (p.getAdvanceItems() == null)
			return;

		// 1. Delete existing advance details
		jdbcTemplate.update("DELETE FROM saleadvest WHERE est_no = ?", p.getEstNo());

		// 2. Insert advance details
		String insertSql = "INSERT INTO saleadvest (est_no, adv_name, adv_no, adv_order_year, adv_amt, schm_bonus, schm_gdwt, barflag) "
				+ "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

		for (SalesAdvestDto item : p.getAdvanceItems()) {
			log.debug("   -> Inserting Advance Item: {}", item.getAdvName());

			boolean barflag = false;
			if (item.getAdvName() != null && item.getAdvName().equalsIgnoreCase("SCHEME")) {
				barflag = false;
			} else {
				// Legacy logic: fetch from ordermaster if not explicitly provided
				if (item.getBarflag() != null) {
					barflag = item.getBarflag();
				} else {
					try {
						Boolean fetchedFlag = jdbcTemplate.queryForObject(
								"SELECT barflag FROM ordermaster WHERE invoiceno = ? LIMIT 1",
								Boolean.class, item.getAdvNo());
						barflag = d(fetchedFlag);
					} catch (Exception e) {
						barflag = false;
					}
				}
			}

			jdbcTemplate.update(insertSql,
					d(p.getEstNo()),
					d(item.getAdvName()),
					d(item.getAdvNo()),
					d(item.getAdvOrderYear()),
					d(item.getAdvAmt()),
					d(item.getSchmBonus()),
					d(item.getSchmGdwt()),
					barflag);
		}
		log.info("✅ [saveAdvestDetails] Advance items saved for EstNo: {}", p.getEstNo());
	}

	@Transactional
	public void savePureestDetails(SalesPureestPayload p) {
		log.info("📝 [savePureestDetails] EstNo: {}, Items: {}", p.getEstNo(),
				(p.getPurchaseItems() != null ? p.getPurchaseItems().size() : 0));
		if (p.getPurchaseItems() == null)
			return;

		// 1. Delete purchase items first
		jdbcTemplate.update("DELETE FROM pureest WHERE est_no = ?", p.getEstNo());

		// 2. Insert purchase items
		String sql = "INSERT INTO pureest ("
				+ "EST_NO, PS_DTE, PS_ITCDE, PS_ITDESC, PS_QTY, PS_GWT, PS_STWT, PS_NTWT, "
				+ "PS_MELTPER, PS_MELT, PS_VALADD, PS_VAL, PS_STCH, dcode, PS_CTNO, PS_CTWT, "
				+ "PURRATE, PS_TAMT, PS_GRATE, PS_SLNO, PS_TOUCH"
				+ ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

		Date estDate = parseDate(p.getEstDte());

		for (PurchaseItemDto item : p.getPurchaseItems()) {
			log.debug("   -> Inserting Purchase Item SlNo: {}, ICode: {}", item.getPsSlno(), item.getPsItcde());
			jdbcTemplate.update(sql, 
					d(p.getEstNo()), 
					d(estDate), 
					d(item.getPsItcde()), 
					d(item.getPsItdesc()), 
					d(item.getPsQty()),
					d(item.getPsGwt()), 
					d(item.getPsStwt()), 
					d(item.getPsNtwt()), 
					d(item.getPsMeltper()), 
					d(item.getPsMelt()),
					d(item.getPsValadd()), 
					d(item.getPsVal()), 
					d(item.getPsStch()), 
					d(item.getDcode()), 
					d(item.getPsCtno()),
					d(item.getPsCtwt()), 
					d(item.getPurrate()), 
					d(item.getPsTamt()), 
					d(item.getPsGrate()), 
					d(item.getPsSlno()),
					d(item.getPsTouch())
			);
		}
		log.info("✅ [savePureestDetails] Purchase items saved for EstNo: {}", p.getEstNo());
	}

	private Date parseDate(String dateStr) {
		try {
			if (dateStr != null && !dateStr.isEmpty()) {
				return Date.valueOf(dateStr);
			}
		} catch (Exception e) {
			// Log if needed
		}
		return new Date(System.currentTimeMillis());
	}
}
