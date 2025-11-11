import knex from '#postgres/knex.js';
import { WbTariffsData, WbWarehouseTariff } from '#common/types/wb.types.js';
import { formatDateToYYYYMMDD } from '#utils/date.format.js';

const toNumeric = (value: string | number) => {
    if (value === '-') {
        return null;
    }
    if (typeof value === 'string') {
        return value.replace(',', '.');
    }
    return value;
};

class DatabaseService {
    public async getSpreadsheetIds(): Promise<string[]> {
        const result = await knex('spreadsheets').select('spreadsheet_id');
        return result.map((row: { spreadsheet_id: string }) => row.spreadsheet_id);
    }

    public async addSpreadsheetId(id: string): Promise<void> {
        await knex('spreadsheets')
            .insert({ spreadsheet_id: id })
            .onConflict('spreadsheet_id')
            .ignore();
        console.log(`Spreadsheet ID ${id} added (if not already present).`);
    }

    public async removeSpreadsheetId(id: string): Promise<void> {
        const deletedCount = await knex('spreadsheets')
            .where({ spreadsheet_id: id })
            .del();
        if (deletedCount > 0) {
            console.log(`Spreadsheet ID ${id} removed.`);
        } else {
            console.log(`Spreadsheet ID ${id} not found.`);
        }
    }

    public async upsertDailyTariff(data: WbTariffsData): Promise<void> {
        const tariffDate = formatDateToYYYYMMDD(new Date()); 

        await knex.transaction(async (trx) => {
            let dailyTariffId: number;

            const existingDailyTariff = await trx('daily_tariffs')
                .where({ date: tariffDate })
                .first();

            if (existingDailyTariff) {
                await trx('daily_tariffs')
                    .where({ id: existingDailyTariff.id })
                    .update({
                        dt_next_box: data.dtNextBox,
                        dt_till_max: data.dtTillMax,
                        updated_at: knex.fn.now(),
                    });
                dailyTariffId = existingDailyTariff.id;
                await trx('warehouse_tariffs')
                    .where({ daily_tariff_id: dailyTariffId })
                    .del();
            } else {
                const result = await trx('daily_tariffs').insert({
                    date: tariffDate,
                    dt_next_box: data.dtNextBox,
                    dt_till_max: data.dtTillMax,
                }).returning('id');
                dailyTariffId = result[0].id;
            }

            const warehouseTariffsToInsert = data.warehouseList.map((warehouseTariff: WbWarehouseTariff) => ({
                daily_tariff_id: dailyTariffId,
                warehouse_name: warehouseTariff.warehouseName,
                geo_name: warehouseTariff.geoName,
                box_delivery_base: toNumeric(warehouseTariff.boxDeliveryBase),
                box_delivery_coef_expr: warehouseTariff.boxDeliveryCoefExpr,
                box_delivery_liter: toNumeric(warehouseTariff.boxDeliveryLiter),
                box_delivery_marketplace_base: toNumeric(warehouseTariff.boxDeliveryMarketplaceBase),
                box_delivery_marketplace_coef_expr: warehouseTariff.boxDeliveryMarketplaceCoefExpr,
                box_delivery_marketplace_liter: toNumeric(warehouseTariff.boxDeliveryMarketplaceLiter),
                box_storage_base: toNumeric(warehouseTariff.boxStorageBase),
                box_storage_coef_expr: warehouseTariff.boxStorageCoefExpr,
                box_storage_liter: toNumeric(warehouseTariff.boxStorageLiter),
            }));

            await trx('warehouse_tariffs').insert(warehouseTariffsToInsert);
        });
    }

    public async getLatestTariffs(): Promise<WbWarehouseTariff[]> {
        const latestDailyTariff = await knex('daily_tariffs')
            .orderBy('date', 'desc')
            .first();

        if (!latestDailyTariff) {
            return [];
        }

        const warehouseTariffs = await knex('warehouse_tariffs')
            .where({ daily_tariff_id: latestDailyTariff.id })
            .orderBy('box_delivery_base', 'asc');

        return warehouseTariffs.map(row => ({
            warehouseName: row.warehouse_name,
            geoName: row.geo_name,
            boxDeliveryBase: row.box_delivery_base,
            boxDeliveryCoefExpr: row.box_delivery_coef_expr,
            boxDeliveryLiter: row.box_delivery_liter,
            boxDeliveryMarketplaceBase: row.box_delivery_marketplace_base,
            boxDeliveryMarketplaceCoefExpr: row.box_delivery_marketplace_coef_expr,
            boxDeliveryMarketplaceLiter: row.box_delivery_marketplace_liter,
            boxStorageBase: row.box_storage_base,
            boxStorageCoefExpr: row.box_storage_coef_expr,
            boxStorageLiter: row.box_storage_liter,
        }));
    }
}

export const databaseService = new DatabaseService();
