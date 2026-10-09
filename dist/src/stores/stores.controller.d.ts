import { CreateStoreDto } from './dto/create-store.dto';
import { ListStoresDto } from './dto/list-stores.dto';
import { StoresService } from './stores.service';
export declare class StoresController {
    private readonly storesService;
    constructor(storesService: StoresService);
    create(dto: CreateStoreDto): Promise<{
        data: import("./stores.service").StoreResponse;
    }>;
    findAll(query: ListStoresDto): Promise<import("./stores.service").PaginatedStores>;
    findOne(id: string): Promise<{
        data: import("./stores.service").StoreResponse;
    }>;
}
