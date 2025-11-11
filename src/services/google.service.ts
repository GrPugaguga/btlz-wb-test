import { google } from 'googleapis';
import { WbWarehouseTariff } from '#common/types/wb.types.js';
import env from '#config/env/env.js';

class GoogleService {
    private sheets: any;

    constructor() {
        const keyFilePath = env.GOOGLE_APPLICATION_CREDENTIALS; 

        if (!keyFilePath) {
            throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        this.sheets = google.sheets({ version: 'v4', auth });
    }

    public async updateSheet(spreadsheetId: string, data: WbWarehouseTariff[]): Promise<void> {
        const sheetName = 'stocks_coefs';

        if (!data || data.length === 0) {
            console.log('No data to write to Google Sheet. Clearing existing data.');
            await this.sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: `${sheetName}!A1:Z`,
            });
            return;
        }


        await this.sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `${sheetName}!A1:Z`, 
        });

        const headers = [
            'warehouseName', 'geoName', 'boxDeliveryBase', 'boxDeliveryCoefExpr',
            'boxDeliveryLiter', 'boxDeliveryMarketplaceBase', 'boxDeliveryMarketplaceCoefExpr',
            'boxDeliveryMarketplaceLiter', 'boxStorageBase', 'boxStorageCoefExpr', 'boxStorageLiter'
        ];
        
        const rows = data.map(tariff => headers.map(header => {
            const value = tariff[header as keyof WbWarehouseTariff];
            return value === null ? '-' : value; 
        }));
        const values = [headers, ...rows];

        await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'RAW', 
            requestBody: {
                values: values,
            },
        });
        console.log(`Google Sheet ${spreadsheetId} updated successfully for sheet "${sheetName}".`);
    }
}

export const googleService = new GoogleService();
