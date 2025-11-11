import axios from 'axios'; 
import type { AxiosInstance } from 'axios';
import env from '#config/env/env.js';
import { WbTariffsApiResponse } from '#common/types/wb.types.js';
import { WbApiError } from '#common/errors/api.errors.js';
import { formatDateToYYYYMMDD } from '#utils/date.format.js';


class WbService {
    private apiUrl: string;
    private apiToken: string;
    private axiosInstance: AxiosInstance;

    constructor() {
        this.apiUrl = env.WB_API_URL;
        this.apiToken = env.WB_API_TOKEN;
        this.axiosInstance = axios.create({
            baseURL: this.apiUrl,
            headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });
    }

    public async fetchTariffs(date: Date = new Date()): Promise<WbTariffsApiResponse> {
        console.log(`Fetching WB tariffs for date: ${date} from: ${this.apiUrl}`);

        try {
            const response = await this.axiosInstance.get('', {
                params: {
                    date: formatDateToYYYYMMDD(date),
                },
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(
                    `Error fetching WB tariffs for date ${date}:`,
                    error.response?.status,
                    error.response?.data || error.message
                );
                throw new WbApiError(
                    `Failed to fetch WB tariffs: ${error.response?.data?.detail || error.message}`,
                    error.response?.status,
                    error.response?.data
                );
            } else {
                console.error(`An unexpected error occurred while fetching WB tariffs for date ${date}:`, error);
                throw new WbApiError('An unexpected error occurred while fetching WB tariffs.', undefined, error);
            }
        }
    }
}

export const wbService = new WbService();

