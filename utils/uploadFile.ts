import { Request } from 'express';
import multer from 'multer';
import AppError from './AppError';

const multerStorage = multer.memoryStorage();
const multerFilter = (req: Request, file: any, cb: any) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else return cb(new AppError('Not an image! Please upload only images!', 400), false);
};
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

export default upload;
