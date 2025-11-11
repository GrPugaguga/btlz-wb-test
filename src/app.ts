import { wbService } from '#services/wb.service.js';
import { databaseService } from '#services/database.service.js';
import { googleService } from '#services/google.service.js';
import knex, { migrate, seed } from "#postgres/knex.js"; // Keep for initial setup
import env from '#config/env/env.js'; // For APP_PORT and scheduling
import cron from 'node-cron';

const APP_PORT = env.APP_PORT || 5000;

async function runMainTask() {
    console.log('Starting main task to fetch, store, and update tariffs...');
    try {
        const wbTariffsData = await wbService.fetchTariffs();
        console.log('Successfully fetched WB tariffs data.');

        await databaseService.upsertDailyTariff(wbTariffsData.response.data);
        console.log('Successfully upserted daily tariffs to database.');

        const latestWarehouseTariffs = await databaseService.getLatestTariffs();
        console.log('Successfully retrieved latest warehouse tariffs from database.');

        const spreadsheetIds = await databaseService.getSpreadsheetIds();
        console.log(`Found ${spreadsheetIds.length} Google Spreadsheet(s) to update.`);

        for (const spreadsheetId of spreadsheetIds) {
            try {
                await googleService.updateSheet(spreadsheetId, latestWarehouseTariffs);
                console.log(`Successfully updated Google Sheet: ${spreadsheetId}`);
            } catch (googleError) {
                console.error(`Error updating Google Sheet ${spreadsheetId}:`, googleError);
            }
        }

        console.log('Main task completed successfully.');
    } catch (error) {
        console.error('Main task failed:', error);
    }
}

async function initializeAndStartApp() {
    try {
        console.log("Running database migrations...");
        await migrate.latest();
        console.log("Database migrations completed.");

        console.log("Running database seeds...");
        await seed.run();
        console.log("Database seeds completed.");

        await runMainTask();

        cron.schedule('0 * * * *', runMainTask);
        console.log(`Main task scheduled to run at the beginning of every hour.`);

        console.log(`Application started on port ${APP_PORT}`);
    } catch (error) {
        console.error('Application initialization failed:', error);
        process.exit(1);
    }
}

initializeAndStartApp();
