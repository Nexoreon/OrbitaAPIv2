/* eslint-disable object-shorthand */
import { Types, Schema, model } from 'mongoose';
import slugify from 'slugify';

export interface IDocumentSection {
    guideId: Types.ObjectId;
    anchor: string;
    title: string;
    meta: {
        createdAt: Date;
        updatedAt: Date;
    };
}

const documentSectionSchema: Schema<IDocumentSection> = new Schema({
    guideId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Секция должна быть прикреплена к справочному материалу'],
    },
    anchor: {
        type: String,
        default: function () {
            return slugify(this.title).toLowerCase();
        },
    },
    title: {
        type: String,
        required: [true, 'Укажите название секции'],
    },
    meta: {
        createdAt: {
            type: Date,
            default: Date,
        },
        updatedAt: Date,
    },
});

const DocumentSection = model<IDocumentSection>('docs_section', documentSectionSchema);

export default DocumentSection;
