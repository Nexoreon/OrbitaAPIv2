import { Schema, model } from 'mongoose';

interface IPackage {
    name: string,
    category: string,
    description: string,
    isDevDep: boolean,
    addedAt: Date,
}

const packageSchema: Schema<IPackage> = new Schema({
    name: {
        type: String,
        required: [true, 'Укажите название пакета'],
        unique: true,
    },
    category: {
        type: String,
        required: [true, 'Укажите категорию пакета'],
    },
    description: {
        type: String,
        required: [true, 'Укажите описание пакета'],
    },
    isDevDep: Boolean,
    addedAt: {
        type: Date,
        default: Date.now,
    },
});

const Package = model<IPackage>('npm-package', packageSchema);

export default Package;
