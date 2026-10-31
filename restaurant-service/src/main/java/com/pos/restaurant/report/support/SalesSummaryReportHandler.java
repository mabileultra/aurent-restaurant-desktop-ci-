package com.pos.restaurant.report.support;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.report.dto.ReceiptJournalFilter;
import com.pos.restaurant.report.dto.SalesSummaryResponse;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;

@Component
public class SalesSummaryReportHandler extends AbstractStoreReportHandler {

    private final ReceiptJournalLoader journalLoader;
    private final SalesReportLoader salesLoader;
    private final SalesTimeBucketQuery timeBucketQuery;

    public SalesSummaryReportHandler(
        FloorTenantSupport tenantSupport,
        ReceiptJournalLoader journalLoader,
        SalesReportLoader salesLoader,
        SalesTimeBucketQuery timeBucketQuery
    ) {
        super(tenantSupport);
        this.journalLoader = journalLoader;
        this.salesLoader = salesLoader;
        this.timeBucketQuery = timeBucketQuery;
    }

    @Transactional(readOnly = true)
    public SalesSummaryResponse summary(Integer storeId, ReceiptJournalFilter filter, String timeZone) {
        ReceiptJournalCriteria criteria = journalCriteria(storeId, filter);
        ZoneId zone = resolveZone(timeZone);
        return new SalesSummaryResponse(
            journalLoader.totals(criteria),
            salesLoader.byMethod(criteria),
            salesLoader.byCardType(criteria),
            salesLoader.byChannel(criteria),
            salesLoader.byHall(criteria),
            timeBucketQuery.byHour(criteria, zone),
            timeBucketQuery.byDay(criteria, zone)
        );
    }
}
