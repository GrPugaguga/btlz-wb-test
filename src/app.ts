import { wbService } from '#services/wb.service.js';
import { databaseService } from '#services/database.service.js';
import { googleService } from '#services/google.service.js';
import { migrate, seed } from "#postgres/knex.js";
import env from '#config/env/env.js';
import cron from 'node-cron';
import Fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

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

        const server = Fastify({ logger: true });

        await server.register(fastifySwagger, {
            openapi: {
                info: {
                    title: 'WB Tariffs Service API',
                    description: 'API to manage and monitor the WB tariffs service.',
                    version: '1.0.0'
                },
            }
        });

        await server.register(fastifySwaggerUi, {
            routePrefix: '/documentation',
        });

        server.get('/health', { schema: { summary: 'Health check' } }, async (request, reply) => {
            return { status: 'ok' };
        });

        server.post('/tasks/run', { schema: { summary: 'Manually trigger the main task' } }, async (request, reply) => {
            runMainTask();
            return reply.code(202).send({ message: 'Main task triggered successfully.' });
        });

        server.get('/spreadsheets', { schema: { summary: 'Get all spreadsheet IDs' } }, async (request, reply) => {
            const ids = await databaseService.getSpreadsheetIds();
            return { spreadsheetIds: ids };
        });

        server.post('/spreadsheets', { schema: { summary: 'Add a new spreadsheet ID', body: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } }, async (request, reply) => {
            const { id } = request.body as { id: string };
            await databaseService.addSpreadsheetId(id);
            return reply.code(201).send({ message: `Spreadsheet ID ${id} added.` });
        });

        server.delete('/spreadsheets/:id', { schema: { summary: 'Remove a spreadsheet ID', params: { type: 'object', properties: { id: { type: 'string' } } } } }, async (request, reply) => {
            const { id } = request.params as { id: string };
            await databaseService.removeSpreadsheetId(id);
            return { message: `Spreadsheet ID ${id} removed.` };
        });

        await server.listen({ port: APP_PORT, host: '0.0.0.0' });
        console.log(`API server listening on port ${APP_PORT}. Documentation available at /documentation`);

    } catch (error) {
        console.error('Application initialization failed:', error);
        process.exit(1);
    }
}

initializeAndStartApp();
