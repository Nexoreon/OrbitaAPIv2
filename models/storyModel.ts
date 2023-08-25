import { Schema, model } from 'mongoose';

export interface IStory {
    title: string;
    img: string;
    width: number;
    modal: {
        title: string;
        text: string;
    };
    button: {
        label: string;
        link: string;
    };
    visible: boolean;
    showAt: Date;
    hideAt: Date;
    createdAt: Date;
}

const storySchema: Schema<IStory> = new Schema({
    title: {
        type: String,
        required: [true, 'Необходимо заполнить заголовок новости'],
    },
    img: String,
    width: {
        type: Number,
        default: 150,
    },
    modal: {
        title: {
            type: String,
            required: [true, 'Необходимо заполнить заголовок'],
        },
        text: {
            type: String,
            required: [true, 'Необходимо заполнить описание новости'],
        },
    },
    button: {
        label: String,
        link: String,
    },
    visible: {
        type: Boolean,
        default: false,
    },
    showAt: {
        type: Date,
        default: Date.now,
    },
    hideAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Story = model<IStory>('dashboard_article', storySchema);

export default Story;
