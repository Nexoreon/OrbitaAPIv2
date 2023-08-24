import mongoose from 'mongoose';

interface IConfiguration {
    appId: number,
    appName: string,
    settings: {
        [key: string]: any
    }
}

const configurationSchema: mongoose.Schema<IConfiguration> = new mongoose.Schema({
    appId: {
        type: Number,
        required: [true, 'Необходимо указать ID приложения!'],
        unique: true,
    },
    appName: {
        type: String,
        required: [true, 'Необходимо указать название приложения!'],
        unique: true,
    },
    settings: Object,
}, {
    strict: false,
});

const Configuration = mongoose.model<IConfiguration>('application', configurationSchema);

export default Configuration;
