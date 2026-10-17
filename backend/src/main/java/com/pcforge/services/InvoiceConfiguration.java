package com.pcforge.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class InvoiceConfiguration {
    private final String sellerName;
    private final String sellerAddress;
    private final String sellerGstin;
    public InvoiceConfiguration(@Value("${pcforge.invoice.seller-name:}") String sellerName,
                                @Value("${pcforge.invoice.seller-address:}") String sellerAddress,
                                @Value("${pcforge.invoice.seller-gstin:}") String sellerGstin) {
        this.sellerName = sellerName; this.sellerAddress = sellerAddress; this.sellerGstin = sellerGstin;
    }
    public String sellerName() { return sellerName; }
    public String sellerAddress() { return sellerAddress; }
    public String sellerGstin() { return sellerGstin; }
    public boolean canIssueTaxInvoice(int rateBps) {
        return rateBps > 0 && !sellerName.isBlank() && !sellerAddress.isBlank() && !sellerGstin.isBlank();
    }
}
