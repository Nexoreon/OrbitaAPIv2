import { Schema, model } from 'mongoose';

interface IIcon {
    name: string,
    isBrand: boolean,
}

const iconSchema: Schema<IIcon> = new Schema({
    name: {
        type: String,
        required: [true, 'Необходимо ввести код иконки'],
    },
    isBrand: {
        type: Boolean,
        default: false,
    },
});

const Icon = model<IIcon>('fa_icons', iconSchema);

export default Icon;
