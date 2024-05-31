import {DataSource} from "typeorm";
import {Room} from "../database/entities/room";
import {RoomRequest, UpdateRoomRequest} from "../handlers/validators/room-validator";

export interface ListRoomFilter {
    page: number
    limit: number
    ascending?: boolean
    orderBy?: string;
}

export class RoomUseCase {
    constructor(private readonly db: DataSource) {
    }

    async listRoom(listRoomFilter: ListRoomFilter): Promise<{ rooms: Room[]; totalCount: number; }> {
        const query = this.db.createQueryBuilder(Room, 'room');

        query.skip((listRoomFilter.page - 1) * listRoomFilter.limit);
        query.take(listRoomFilter.limit);

        if (listRoomFilter.orderBy) {
            const direction = listRoomFilter.ascending ? 'ASC' : 'DESC';
            query.orderBy(`room.${listRoomFilter.orderBy}`, direction);
        }

        const [rooms, totalCount] = await query.getManyAndCount();
        return {rooms, totalCount};
    }

    async createRoom(showData: RoomRequest): Promise<Room | Error> {
        const roomRepository = this.db.getRepository(Room);

        const newRoom = new Room();
        newRoom.name = showData.name;
        newRoom.description = showData.description;
        newRoom.capacity = showData.capacity;
        ;
        newRoom.handicapAvailable = showData.handicapAvailable;
        newRoom.state = showData.state;
        newRoom.type = showData.type;

        return await roomRepository.save(newRoom);
    }

    async getRoomById(roomId: number): Promise<{ room: Room | null, message?: string }> {
        const roomRepository = this.db.getRepository(Room);

        const room = await roomRepository.findOne({
            where: {id: roomId}
        });

        if (room) {
            if (!room.state) {
                return {
                    room: room,
                    message: "This room is currently under maintenance."
                };
            } else {

                const roomWithRelations = await roomRepository.findOne({
                    where: {id: roomId},
                    relations: ["shows", "shows.movie"]
                });
                return {room: roomWithRelations};
            }
        }

        return {room: null};
    }

    async getRoomShows(roomId: number): Promise<Room | null> {

        const roomRepository = this.db.getRepository(Room);
        return await roomRepository.findOne({
            where: {id: roomId},
            relations: {
                shows: true,
            }
        });
    }

    async updateRoom(roomId: number, roomData: UpdateRoomRequest): Promise<Room | Error> {
        const roomRepository = this.db.getRepository(Room);
        const room = await roomRepository.findOneBy({id: roomId})

        if (!room) {
            throw new Error(`Room ${roomId} not found`);
        }

        if (roomData.name != undefined && roomData.name != room.name) {
            room.name = roomData.name;
        }

        if (roomData.description != undefined && roomData.description != room.description) {
            room.description = roomData.description;
        }

        if (roomData.type != undefined && roomData.type != room.type) {
            room.type = roomData.type;
        }

        if (roomData.state != undefined && roomData.state != room.state) {
            room.state = roomData.state;
        }

        if (roomData.handicapAvailable != undefined && roomData.handicapAvailable != room.handicapAvailable) {
            room.handicapAvailable = roomData.handicapAvailable;
        }
        return await roomRepository.save(room);
    }
}