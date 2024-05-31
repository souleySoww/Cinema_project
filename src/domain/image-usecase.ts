import {DataSource} from "typeorm/data-source/DataSource";
import {Repository} from "typeorm/repository/Repository";
import {Image} from "../database/entities/image";
import {Ticket} from "../database/entities/ticket";
import {R2} from 'node-cloudflare-r2';
import fs from 'fs';
import multer from 'multer';
import {Movie} from "../database/entities/movie";

export class ImageUseCase {
    private imageRepository: Repository<Image>;
    private ticketRepository: Repository<Ticket>;
    private bucket;
    private upload;

    constructor(private readonly db: DataSource) {

        this.imageRepository = this.db.getRepository(Image);
        this.ticketRepository = this.db.getRepository(Ticket);

        // Configuration du client Cloudflare R2
        const r2 = new R2({
            accountId: "caa6c6a851c36756c3efa2578fdc46d3",
            accessKeyId: "5ea8356afe43f61a5ea510e0bf8516ea",
            secretAccessKey: "a03976f622a83be304ad46f4676e491ef2aded0c92c7bf9feb72c1134f677db7"
        });
        this.bucket = r2.bucket("cinema-js-images");

        // Configuration du stockage local via Multer
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, '/Users/ethan/Documents/cours/api-node/Cinema/src/images');
            },
            filename: function (req, file, cb) {
                cb(null, file.fieldname + '-' + Date.now());
            }
        });

        this.upload = multer({storage: storage});
    }

    // Middleware Multer pour l'upload
    getMulterMiddleware() {
        return this.upload.single('image');
    }

    // Méthode d'upload vers Cloudflare R2
    async uploadImage(localPath: string, originalName: string): Promise<string | Error> {
        try {
            const uploadResult = await this.bucket.uploadFile(localPath, originalName);
            fs.unlinkSync(localPath);

            return uploadResult.objectKey;
        } catch (error: any) {
            console.error('Upload Error:', error);
            return new Error('Internal server error');
        }
    }

    async createImage(originalName: string, movie: Movie): Promise<Image> {
        const imageRepo = this.db.getRepository(Image);

        let temp = originalName.split('.');


        let image = new Image();
        image.name = originalName;
        image.movie = movie;
        image.type = temp[temp.length - 1];
        image.path = "https://pub-b084fba6ab354e1ba73a46bc1046171d.r2.dev/" + originalName;

        return await imageRepo.save(image);
    }
}
