
export interface WbWarehouseTariff {
    boxDeliveryBase: string; 
    boxDeliveryCoefExpr: string; 
    boxDeliveryLiter: string; 
    boxDeliveryMarketplaceBase: string; 
    boxDeliveryMarketplaceCoefExpr: string; 
    boxDeliveryMarketplaceLiter: string; 
    boxStorageBase: string; 
    boxStorageCoefExpr: string;
    boxStorageLiter: string; 
    geoName: string; 
    warehouseName: string; 
}

export interface WbTariffsData {
    dtNextBox: string;
    dtTillMax: string; 
    warehouseList: WbWarehouseTariff[];
}

export interface WbTariffsResponseData {
    data: WbTariffsData;
}

export interface WbTariffsApiResponse {
    response: WbTariffsResponseData;
}


export interface WbApiErrorResponse {
    title: string;
    detail: string;
    origin: string;
    requestId: string;
    code?: string; 
    status?: number;
    statusText?: string; 
    timestamp?: string;
}





